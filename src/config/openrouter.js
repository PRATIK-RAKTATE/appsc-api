const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const openRouterConfig = {
  baseUrl: OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  embeddingModel:
    process.env.OPENROUTER_EMBEDDING_MODEL ||
    "google/gemini-embedding-001",
  chatModel:
    process.env.OPENROUTER_CHAT_MODEL ||
    "meta-llama/llama-3.2-3b-instruct:free",
};