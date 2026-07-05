/**
 * Every SentinelAI backend endpoint responds with this envelope:
 *   { success: boolean, message: string, data: T | null }
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  data: unknown;
}
