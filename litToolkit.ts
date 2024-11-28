import { type ToolInterface, BaseToolkit } from "@langchain/core/tools";
import { LitSignerTool } from "./litSignerTool.js";
import { type ToolParams } from "@langchain/core/tools";
import { LIT_NETWORK_VALUES, LIT_NETWORK } from "@lit-protocol/constants";
import { LitNodeClient } from "@lit-protocol/lit-node-client";

/**
 * Options for the Lit tools.
 */
export type LitFields = ToolParams & {
  litPrivateKey: string;
  litNetwork?: LIT_NETWORK_VALUES;
  litNodeClient?: LitNodeClient;
};

/**
 * Represents a toolkit for working with JSON data. It initializes the
 * JSON tools based on the provided JSON specification.
 * @example
 * ```typescript
 * const toolkit = new JsonToolkit(new JsonSpec());
 * const executor = createJsonAgent(model, toolkit);
 * const result = await executor.invoke({
 *   input: 'What are the required parameters in the request body to the /completions endpoint?'
 * });
 * ```
 */
export class LitToolkit extends BaseToolkit {
  tools: ToolInterface[];

  protected litPrivateKey?: string;
  protected litNetwork?: LIT_NETWORK_VALUES;
  protected litNodeClient?: LitNodeClient;

  constructor(public litFields: LitFields) {
    super();
    this.litPrivateKey = litFields.litPrivateKey;
    this.litNetwork = litFields.litNetwork ?? LIT_NETWORK.DatilDev;
    this.litNodeClient = litFields.litNodeClient;
    this.tools = [
      new LitSignerTool({
        litPrivateKey: this.litPrivateKey,
        litNetwork: this.litNetwork,
        litNodeClient: this.litNodeClient,
      }),
    ];
  }

  async mintPkp() {}

  static async create(litFields: LitFields): Promise<LitToolkit> {
    if (!litFields.litPrivateKey) {
      throw new Error(
        `No Lit private key found. Pass a private key as "litPrivateKey".`
      );
    }
    if (!litFields.litNetwork) {
      litFields.litNetwork = LIT_NETWORK.DatilDev;
    }
    if (!litFields.litNodeClient) {
      litFields.litNodeClient = new LitNodeClient({
        litNetwork: litFields.litNetwork,
      });
    }
    if (!litFields.litNodeClient.ready) {
      await litFields.litNodeClient.connect();
    }
    return new LitToolkit(litFields);
  }
}
