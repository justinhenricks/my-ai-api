import type { NextFunction, Request, Response } from "express";

import { RetrievalQAChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { llm, vectorStore } from "../services/ai";
import { ApiError } from "../utils/api-error";
export class QuestionsController {
  static async answerQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { question } = req.body;

      const template = `Use the following pieces of context to answer the question at the end. If you come across dates/times to use in your answer, please format them and use a 12-hour clock. If you don't know the answer, just say that you don't know, don't try to make up an answer. After saying you don't know, you can say, "I will take my best guess" and then give your best guess. Use three sentences maximum and keep the answer as concise as possible. Always say "thanks for asking!" at the end of the answer.
      ----------------
      CONTEXT: {context}
      ----------------
      QUESTION: {query}
      ----------------
      Helpful Answer:`;

      const chain = RetrievalQAChain.fromLLM(
        llm,
        vectorStore.asRetriever({ searchKwargs: { fetchK: 7 } }),
        {
          prompt: PromptTemplate.fromTemplate(template),
        }
      );

      const response = await chain.call({
        query: question,
      });

      const answer = response.text;

      res.json({ answer });
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }
}
