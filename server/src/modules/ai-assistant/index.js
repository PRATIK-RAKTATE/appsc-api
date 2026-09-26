export { generateEmbedding, generateQueryEmbedding } from "./services/embedding.service.js";

export const addTranslationJob = async (...args) => {
  const { addTranslationJob: enqueue } = await import(
    "./services/translation.queue.service.js"
  );
  return enqueue(...args);
};
