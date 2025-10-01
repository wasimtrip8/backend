import dotenv from "dotenv";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = `https://api.openai.com/v1/chat/completions`;

interface OpenAIMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface OpenAIRequestBody {
  model: string;
  messages: OpenAIMessage[];
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const callOpenAI = async (textPrompt: string): Promise<OpenAIResponse> => {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }

  const body: OpenAIRequestBody = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: textPrompt }],
  };

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errData = await response.json();
    console.error("OpenAI API Error:", errData);
    throw new Error(errData.error?.message || "Unknown OpenAI API error");
  }

  return response.json() as Promise<OpenAIResponse>;
};
