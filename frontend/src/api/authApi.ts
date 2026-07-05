import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types/auth";

/**
 * NOTE on the login contract: the backend's `/auth/login` route accepts a
 * JSON body of `{ email, password }` (see app/api/auth.py + UserLogin
 * schema) — not an OAuth2 `application/x-www-form-urlencoded` form with a
 * `username` field. This client is written to match the real backend
 * contract so the app works against it out of the box.
 */
export async function login(payload: LoginPayload): Promise<AuthResponseData> {
  const { data } = await axiosClient.post<ApiResponse<AuthResponseData>>(
    "/auth/login",
    payload
  );
  return unwrap(data);
}

export async function register(
  payload: RegisterPayload
): Promise<AuthResponseData> {
  const { data } = await axiosClient.post<ApiResponse<AuthResponseData>>(
    "/auth/register",
    payload
  );
  return unwrap(data);
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await axiosClient.get<ApiResponse<{ user: User }>>(
    "/auth/me"
  );
  return unwrap(data).user;
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new Error(response.message || "Request did not return any data.");
  }
  return response.data;
}
