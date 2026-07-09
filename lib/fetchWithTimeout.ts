const DEFAULT_TIMEOUT = 8000;

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { next?: { revalidate?: number } } = {},
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const res = await Promise.race([
      fetch(url, { ...options, signal: controller.signal }),
      timeoutPromise,
    ]);
    clearTimeout(timeout!);
    return res;
  } catch (e) {
    clearTimeout(timeout!);
    throw e;
  }
}