import { Prisma } from "@prisma/client";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { OPEN_AI_KEY } from "../../constants";
import { db } from "../../db";
export const llm = new OpenAI({
  openAIApiKey: OPEN_AI_KEY,
  modelName: "gpt-4",
});

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: OPEN_AI_KEY,
});

export const vectorStore = PrismaVectorStore.withModel(db).create(embeddings, {
  prisma: Prisma,
  tableName: "Document",
  vectorColumnName: "vector",
  columns: {
    id: PrismaVectorStore.IdColumn,
    content: PrismaVectorStore.ContentColumn,
  },
});
