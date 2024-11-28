import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { StructuredTool, type ToolParams } from "@langchain/core/tools";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
  LIT_NETWORK_VALUES,
  LIT_NETWORK,
  AUTH_METHOD_TYPE,
  AUTH_METHOD_SCOPE,
  LIT_ABILITY,
  LIT_RPC,
} from "@lit-protocol/constants";
import { type LitFields } from "./litToolkit.js";
import { z } from "zod";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import ethers from "ethers";
import {
  LitActionResource,
  LitPKPResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

/**
 * Options for the LitSignerTool.
 */
export class LitPkpTool extends StructuredTool {
  static lc_name(): string {
    return "Lit";
  }

  description =
    "Can create a Lit PKP for a user, which is a wallet held on the Lit Protocol Nodes.  The PKP Public Key can be used as a parameter when signing messages and transactions";

  name = "LitPKPMinter";

  protected litPrivateKey: string;
  protected litNetwork?: LIT_NETWORK_VALUES;
  protected litNodeClient?: LitNodeClient;
  protected signer: ethers.Wallet;
  protected debug: boolean;

  schema = z.object({
    sendPkpToItself: z
      .boolean()
      .describe(
        "Whether to send the PKP to itself.  If the user does not explicitly specify, then pass in false"
      ),
  });

  constructor(fields?: LitFields) {
    super(fields);
    this.litPrivateKey = fields?.litPrivateKey!;
    this.litNetwork = fields?.litNetwork || LIT_NETWORK.DatilDev;
    this.litNodeClient = fields?.litNodeClient;
    this.debug = fields?.debug ?? false;
    this.signer = new ethers.Wallet(
      this.litPrivateKey,
      new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
    );
  }

  protected async _call(
    input: z.infer<typeof this.schema>,
    _runManager?: CallbackManagerForToolRun
  ): Promise<string> {
    try {
      const contractClient = new LitContracts({
        signer: this.signer,
        network: this.litNetwork,
        debug: this.debug,
      });
      await contractClient.connect();

      const toSign = await createSiweMessage({
        uri: "http://localhost/createWallet",
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        resources: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution,
          },
          {
            resource: new LitPKPResource("*"),
            ability: LIT_ABILITY.PKPSigning,
          },
        ],
        walletAddress: this.signer.address,
        nonce: await this.litNodeClient!.getLatestBlockhash(),
        litNodeClient: this.litNodeClient,
      });

      const authSig = await generateAuthSig({
        signer: this.signer,
        toSign,
      });

      const authMethod = {
        authMethodType: AUTH_METHOD_TYPE.EthWallet,
        accessToken: JSON.stringify(authSig),
      };

      const mintInfo = await contractClient.mintWithAuth({
        authMethod: authMethod,
        scopes: [AUTH_METHOD_SCOPE.SignAnything],
      });

      return JSON.stringify(mintInfo);
    } catch (error) {
      console.error("Error minting PKP", error);
      return "Error minting PKP";
    }
  }
}
