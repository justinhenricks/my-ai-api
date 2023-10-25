export class ApiError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(statusCode: number, message: string, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(error: unknown, errors?: any[]): ApiError {
    console.log(error);
    if (error instanceof Error) {
      return new ApiError(400, error.message, errors);
    }
    return new ApiError(
      400,
      "Sorry, something went wrong please try again!",
      errors
    );
  }

  static notFound(message: string, errors?: any[]) {
    return new ApiError(404, message, errors);
  }

  static unauthorized(message: string, errors?: any[]) {
    return new ApiError(401, message, errors);
  }

  // Add more static methods as needed for other HTTP status codes
}
