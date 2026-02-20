import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

let _client: BedrockRuntimeClient | null = null;

const BEDROCK_KEY = process.env.AWS_ACCESS_KEY_ID || "";
const BEDROCK_SECRET = process.env.AWS_SECRET_ACCESS_KEY || "";
const BEDROCK_REGION = process.env.AWS_REGION || "us-west-2";

function getClient() {
  if (!_client) {
    _client = new BedrockRuntimeClient({
      region: BEDROCK_REGION,
      credentials: {
        accessKeyId: BEDROCK_KEY,
        secretAccessKey: BEDROCK_SECRET,
      },
    });
  }
  return _client;
}

export async function askBedrock(prompt: string, maxTokens = 1024) {
  const start = Date.now();
  try {
    const client = getClient();
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const res = await client.send(command);
    const body = JSON.parse(new TextDecoder().decode(res.body));
    const duration = Date.now() - start;
    const tokens = (body.usage?.input_tokens || 0) + (body.usage?.output_tokens || 0);
    return {
      text: body.content[0].text,
      meta: { duration_ms: duration, tokens_used: tokens, source: "bedrock" },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Bedrock Error]", message);
    return { text: null, meta: { duration_ms: Date.now() - start, source: "error", error: message } };
  }
}
