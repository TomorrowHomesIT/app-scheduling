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

  return fallback;
};
