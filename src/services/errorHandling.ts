/**
 * Error handling utility for API calls
 * Provides better error logging and type-safe error handling
 */

export class APIError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Logs detailed error information for debugging
 * Call this in catch blocks to get full error details
 */
export function logError(error: unknown, context: string): void {
  console.error(`\n❌ ${context}`);
  console.error('─'.repeat(50));

  if (error instanceof APIError) {
    console.error(`Message: ${error.message}`);
    console.error(`Status: ${error.status || 'N/A'}`);
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  } else if (typeof error === 'string') {
    console.error(`Error: ${error}`);
  } else {
    console.error('Unknown error:', JSON.stringify(error, null, 2));
  }

  console.error('─'.repeat(50) + '\n');
}

/**
 * Extracts readable error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Wraps fetch calls with better error handling
 * Returns APIError with status code and original error
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  context?: string,
): Promise<T> {
  try {
    console.log(`📡 API Request: ${options?.method || 'GET'} ${url}`);

    const response = await fetch(url, options);
    const statusText = `${response.status} ${response.statusText}`;

    console.log(`✅ API Response: ${statusText}`);

    if (!response.ok) {
      let errorData: any;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch (parseErr) {
        errorData = 'Could not parse error response';
      }

      const errorMessage = errorData?.message || errorData || `HTTP ${response.status}`;
      throw new APIError(
        `${context || 'API call'} failed: ${errorMessage}`,
        response.status,
        errorData,
      );
    }

    const data = await response.json();
    console.log(`📦 Response data:`, data);
    return data;
  } catch (error) {
    logError(error, context || 'API Call Failed');
    throw error instanceof APIError ? error : new APIError(getErrorMessage(error), undefined, error);
  }
}
