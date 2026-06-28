import OpenAI from "openai";

let clientInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY belum dikonfigurasi.");
    clientInstance = new OpenAI({ apiKey });
  }
  return clientInstance;
}

export const OPENAI_MODEL = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";
