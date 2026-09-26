const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const openRouterConfig = {
  baseUrl: OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  embeddingModel:
    process.env.OPENROUTER_EMBEDDING_MODEL ||
    "google/gemini-embedding-001",
};