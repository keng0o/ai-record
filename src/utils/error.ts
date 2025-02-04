export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleApiError = (error: unknown) => {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code };
  }

  return {
    success: false,
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  };
};
