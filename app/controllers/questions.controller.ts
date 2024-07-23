import type { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PromptTemplate } from "@langchain/core/prompts";

// import { RetrievalQAChain } from "langchain/chains";
import { pull } from "langchain/hub";
import { IS_PROD } from "../constants";
import { llm, vectorStore } from "../services/ai";
import { ApiError } from "../utils/api-error";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
export class QuestionsController {
  static async answerQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { question } = req.body;

      // const template = `
      // Use the provided context to answer the subsequent question. In this context, 'you' or 'your' refers to Justin and you should answer using justin's name. If the answer isn't apparent from the context, be transparent about it, then craft a response that's both kind and playful. For questions about gigs, be sure to take todays date which is ${new Date().toLocaleDateString()} in account and prioritize the context that has dates closest to today. If there are any dates or times, format them in a 12-hour clock format. Be succinct, and limit your response to 4 sentences at most. Conclude your answer with "Thanks for asking!"
      // ----------------
      // CONTEXT: {context}
      // ----------------
      // QUESTION: {query}
      // ----------------
      // RESPONSE:
      // `;

      const template = `Use the following pieces of context to answer the question at the end.
                        If you don't know the answer, just say that you don't know, don't try to make up an answer. Instead offer a funny joke instead.
                        For dates, use US Eastern Time zone.
                        Use four sentences maximum and keep the answer as concise as possible.
                        Always say "thanks for asking!" at the end of the answer.

                        {context}

                        Question: {question}

                        Helpful Answer:`;

      const retriever = vectorStore.asRetriever();

      const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

      const customRagPrompt = PromptTemplate.fromTemplate(template);

      const ragChain = await createStuffDocumentsChain({
        llm,
        prompt: customRagPrompt,
        outputParser: new StringOutputParser(),
      });

      const retrievedDocs = await retriever.invoke(question);

      const answer = await ragChain.invoke({
        question: question,
        context: retrievedDocs,
      });

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
