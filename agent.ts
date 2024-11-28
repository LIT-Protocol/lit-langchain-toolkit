// agent.ts

import * as dotenv from "dotenv";
dotenv.config();

import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Add validation for required environment variables
if (!process.env.ANTHROPIC_API_KEY || !process.env.TAVILY_API_KEY) {
  throw new Error("Missing required environment variables. Check .env file");
}

// Define the tools for the agent to use
// Define the tools for the agent to use
const weatherTool = tool(
  async ({ query }) => {
    // This is a placeholder for the actual implementation
    if (
      query.toLowerCase().includes("sf") ||
      query.toLowerCase().includes("san francisco")
    ) {
      return "It's 60 degrees and foggy.";
    }
    return "It's 90 degrees and sunny.";
  },
  {
    name: "weather",
    description: "Call to get the current weather for a location.",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
    }),
  }
);
const tools = [new TavilySearchResults({ maxResults: 3 }), weatherTool];
const toolNode = new ToolNode(tools);

// Create a model and give it access to the tools
const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0,
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1];

  // If the LLM wants to use a tool, then we route to the "tools" node
  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

// Main execution function
async function main() {
  try {
    // Use the agent
    const finalState = await app.invoke({
      messages: [new HumanMessage("what is the weather in sf")],
    });
    console.log(finalState.messages[finalState.messages.length - 1].content);

    const nextState = await app.invoke({
      // Including the messages from the previous run gives the LLM context.
      // This way it knows we're asking about the weather in NY
      messages: [...finalState.messages, new HumanMessage("what about ny")],
    });
    console.log(nextState.messages[nextState.messages.length - 1].content);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute the main function
main();
