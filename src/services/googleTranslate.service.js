import { TranslationServiceClient } from "@google-cloud/translate";
import { googleTranslateConfig } from "../config/googleTranslate.js";

const client = new TranslationServiceClient();

export const translateText = async (text, targetLanguageCode = "te") => {
  if (!text) {
    throw new Error("Text is required for translation");
  }

  const request = {
    parent: `projects/${googleTranslateConfig.projectId}/locations/global`,
    contents: [text],
    mimeType: "text/plain",
    sourceLanguageCode: "en",
    targetLanguageCode,
  };

  const [response] = await client.translateText(request);
  return response.translations[0]?.translatedText || "";
};
