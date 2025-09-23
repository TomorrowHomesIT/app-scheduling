import { AxiosError } from "axios";

export const getApiErrorMessage = async (e: unknown, fallback = "An unknown error occurred") => {
  if (e instanceof Response) {
    const body = await e.json();

    if (body?.error?.message) {
      return body.error.message;
    }

    if (body?.message) {
      return body.message;
    }

    if (body?.error) {
      return body.error;
    }
  }

  if (e instanceof AxiosError) {
    return e.response?.data?.message || e.response?.data?.error || e.message;
  }

  return fallback;
};

// Helper function to check if error is retryable
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    if (error.response) {
      return (
        error.response.status === 0 ||
        error.response.status === 408 ||
        error.response.status === 429 ||
        error.response.status >= 500
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.log("Request was made but no response was received", error.request);
      return true;
    }
  }

  return false;
};
