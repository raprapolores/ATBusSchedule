const REGION_RETRY_DELAYS_MS = [5_000, 10_000, 15_000, 20_000, 30_000];

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const isRetryableStatus = (status: number) =>
  status === 408 || status === 429 || status >= 500;

export async function fetchRegionsWithRetry<T>(url: string): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(url);
    } catch (error) {
      const delay = REGION_RETRY_DELAYS_MS[Math.min(attempt, REGION_RETRY_DELAYS_MS.length - 1)];
      console.warn(`Unable to load regions. Retrying in ${delay / 1_000} seconds.`, error);
      await wait(delay);
      continue;
    }

    if (response.ok) return response.json();

    if (!isRetryableStatus(response.status)) {
      throw new Error(`Failed to fetch regions (HTTP ${response.status})`);
    }

    const delay = REGION_RETRY_DELAYS_MS[Math.min(attempt, REGION_RETRY_DELAYS_MS.length - 1)];
    console.warn(`Regions request failed with HTTP ${response.status}. Retrying in ${delay / 1_000} seconds.`);
    await wait(delay);
  }
}
