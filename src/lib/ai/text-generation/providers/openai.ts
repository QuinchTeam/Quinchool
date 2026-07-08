import OpenAI from "openai";

let openAIClient: OpenAI | null = null;

export interface GenerateOpenAITextParams {
  prompt: string;
  providerModelId: string;
}

export interface GenerateOpenAITextResult {
  providerModelId: string;
  text: string;
}

function getOpenAIClient() {
  if (!openAIClient) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    openAIClient = new OpenAI({ apiKey });
  }

  return openAIClient;
}

export async function generateOpenAIText({
  prompt,
  providerModelId,
}: GenerateOpenAITextParams): Promise<GenerateOpenAITextResult> {
  const response = await getOpenAIClient().responses.create({
    model: providerModelId,
    input: prompt,
  });

  if (!response.output_text) {
    throw new Error("OpenAI returned no text output");
  }

  return {
    providerModelId,
    text: response.output_text,
  };
}
