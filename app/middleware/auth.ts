import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for Authorization header
  const apiToken = req.headers["x-api-token"];

  if (!apiToken || typeof apiToken !== "string") {
    return next(ApiError.unauthorized("Unauthorized"));
  }

  try {
    // Check if the token exists in the User table
    const tokenMatch = apiToken === process.env.SECRET_TOKEN;

    if (!tokenMatch) {
      return next(ApiError.unauthorized("Unauthorized, get outta here!"));
    }

    // Move to the next middleware or route handler
    next();
  } catch (error) {
    return next(ApiError.unauthorized("Error verifying token"));
  }
};
