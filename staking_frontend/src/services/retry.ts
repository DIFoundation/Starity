export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 200
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
