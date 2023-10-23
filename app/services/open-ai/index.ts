import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { OPEN_AI_KEY } from "../../constants";
export const llm = new OpenAI({
  openAIApiKey: OPEN_AI_KEY,
  modelName: "gpt-4",
});

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: OPEN_AI_KEY,
});
