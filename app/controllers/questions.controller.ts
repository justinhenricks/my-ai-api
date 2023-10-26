import type { NextFunction, Request, Response } from "express";
import { db } from "../db";

import { RetrievalQAChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { IS_PROD } from "../constants";
import { llm, vectorStore } from "../services/ai";
import { ApiError } from "../utils/api-error";
export class QuestionsController {
  static async answerQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { question } = req.body;

      const template = `
      Use the provided context to answer the subsequent question. In this context, 'you' or 'your' refers to Justin and you should answer using justin's name. If the answer isn't apparent from the context, be transparent about it, then craft a response that's both kind and playful. For questions about gigs, be sure to take todays date which is ${new Date().toLocaleDateString()} in account and prioritize the context that has dates closest to today. If there are any dates or times, format them in a 12-hour clock format. Be succinct, and limit your response to 4 sentences at most. Conclude your answer with "Thanks for asking!"
      ----------------
      CONTEXT: {context}
      ----------------
      QUESTION: {query}
      ----------------
      RESPONSE:
      `;

      const chain = RetrievalQAChain.fromLLM(
        llm,
        vectorStore.asRetriever({
          searchKwargs: { fetchK: 15 },
          verbose: !IS_PROD,
        }),
        {
          prompt: PromptTemplate.fromTemplate(template),
        }
      );

      const response = await chain.call({
        query: question,
      });

      const answer = response.text;

      await db.questionAnswer.create({
        data: {
          question,
          answer,
        },
      });

      res.json({ answer });
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }
}
