import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { Tool, type ToolParams } from "@langchain/core/tools";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK_VALUES, LIT_NETWORK } from "@lit-protocol/constants";

/**
 * Options for the Lit tool.
 */
export type LitFields = ToolParams & {
  litPrivateKey?: string;
  litNetwork?: LIT_NETWORK_VALUES;
};

/**
 * Tavily search API tool integration.
 *
 * Setup:
 * Install `@langchain/community`. You'll also need an API key set as `TAVILY_API_KEY`.
 *
 * ```bash
 * npm install @langchain/community
 * ```
 *
 * ## [Constructor args](https://api.js.langchain.com/classes/_langchain_community.tools_tavily_search.TavilySearchResults.html#constructor)
 *
 * <details open>
 * <summary><strong>Instantiate</strong></summary>
 *
 * ```typescript
 * import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
 *
 * const tool = new TavilySearchResults({
 *   maxResults: 2,
 *   // ...
 * });
 * ```
 * </details>
 *
 * <br />
 *
 * <details>
 *
 * <summary><strong>Invocation</strong></summary>
 *
 * ```typescript
 * await tool.invoke("what is the current weather in sf?");
 * ```
 * </details>
 *
 * <br />
 *
 * <details>
 *
 * <summary><strong>Invocation with tool call</strong></summary>
 *
 * ```typescript
 * // This is usually generated by a model, but we'll create a tool call directly for demo purposes.
 * const modelGeneratedToolCall = {
 *   args: {
 *     input: "what is the current weather in sf?",
 *   },
 *   id: "tool_call_id",
 *   name: tool.name,
 *   type: "tool_call",
 * };
 * await tool.invoke(modelGeneratedToolCall);
 * ```
 *
 * ```text
 * ToolMessage {
 *   "content": "...",
 *   "name": "tavily_search_results_json",
 *   "additional_kwargs": {},
 *   "response_metadata": {},
 *   "tool_call_id": "tool_call_id"
 * }
 * ```
 * </details>
 */
export class Lit extends Tool {
  static lc_name(): string {
    return "Lit";
  }

  description =
    "A decentralized key management system that can conditionally sign with ecdsa and conditionally decrypt messages.";

  name = "lit";

  protected litPrivateKey?: string;
  protected litNetwork?: LIT_NETWORK_VALUES;

  constructor(fields?: LitFields) {
    super(fields);
    this.litPrivateKey = fields?.litPrivateKey;
    this.litNetwork = fields?.litNetwork || LIT_NETWORK.DatilDev;
    if (this.litPrivateKey === undefined) {
      throw new Error(
        `No Lit private key found. Pass a private key as "litPrivateKey".`
      );
    }
  }

  protected async _call(
    input: string,
    _runManager?: CallbackManagerForToolRun
  ): Promise<string> {
    // do something with lit
    return "success";
    //   throw new Error(
    //     `Request failed with status code ${response.status}: ${json.error}`
    //   );
    // }
    // if (!Array.isArray(json.results)) {
    //   throw new Error(`Could not parse Tavily results. Please try again.`);
    // }
    // return JSON.stringify(json.results);
  }
}
