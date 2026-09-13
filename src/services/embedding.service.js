import { openRouterConfig } from "../config/openrouter.js";

const EMBEDDING_DIMENSIONS = 1536;

export const generateEmbedding = async (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Text is required for embedding generation");
  }

  if (!openRouterConfig.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(
    `${openRouterConfig.baseUrl}/embeddings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openRouterConfig.embeddingModel,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding generation failed: ${error}`);
  }

  const data = await response.json();

  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("Invalid embedding response");
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`
    );
  }

  return embedding;
};