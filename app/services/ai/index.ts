import { Prisma } from "@prisma/client";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";
import { OPEN_AI_KEY } from "../../constants";
import { db } from "../../db";

export const llm = new ChatOpenAI({
  apiKey: OPEN_AI_KEY,
  model: "gpt-4o",
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
