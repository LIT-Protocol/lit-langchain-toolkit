# Lit Langchain Toolkit

This is a simple toolkit for using Lit Protocol with Langchain.

## Running the example agent

Copy `.env.example` to `.env` and fill in the values.

```bash
npm install
npm run dev
```

You can ask the agent something like "mint a PKP for me and use it to sign the message 'hello world'". You can follow up and ask what the PKP used was, or what the actual signed data was. You can check the result with `ethers.utils.recoverPublicKey(digest, signature)` and I've done this and it seems correct.

## Supported tools

- `LitSignerTool`: Signs a message or transaction using ECDSA secp256k1 with Lit Protocol
- `LitPkpTool`: Creates a PKP and returns it

## How it works

When you create a `LitToolkit`, it will automatically connect to the Lit Nodes and save a reference to the connected Lit Node Client, and pass this in to all the tools so we only have to connect once.
