// agent.ts

import * as dotenv from "dotenv";
dotenv.config();

import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { LitToolkit } from "./litToolkit.js";
import { LIT_NETWORK } from "@lit-protocol/constants";
import * as readline from "readline/promises";

// Add validation for required environment variables
if (!process.env.ANTHROPIC_API_KEY || !process.env.LIT_LANGCHAIN_PRIVATE_KEY) {
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
const litToolkit = await LitToolkit.create({
  litNetwork: LIT_NETWORK.DatilDev,
  litPrivateKey: process.env.LIT_LANGCHAIN_PRIVATE_KEY,
});
const { tools } = litToolkit;
const toolNode = new ToolNode(tools);

// Create a model and give it access to the tools
const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0,
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1];
  //   console.log("lastMessage", lastMessage);

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
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("Starting chat (Press Ctrl+C to exit)...");

    let prevState: typeof MessagesAnnotation.State | null = null;
    while (true) {
      const input = await rl.question("\nYou: ");
      if (!input) continue;

      prevState = await app.invoke({
        messages: [...(prevState?.messages || []), new HumanMessage(input)],
      });
      const lastMessage = prevState?.messages[prevState.messages.length - 1];
      if (lastMessage && lastMessage instanceof AIMessage) {
        console.log("\nAssistant:", lastMessage.content);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("SIGINT")) {
      console.log("\nGoodbye!");
    } else {
      console.error("Error:", error);
    }
  }
}

// Execute the main function
main();
