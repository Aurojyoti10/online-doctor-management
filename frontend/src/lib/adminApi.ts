
const API_URL = 'http://localhost:5001/api';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
};

export async function adminApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const stored = localStorage.getItem('careconnect_auth');

  if (!stored) {
    throw new Error('Please log in again to continue.');
  }

  let token: string | undefined;

  try {
    token = JSON.parse(stored).token;
  } catch {
    throw new Error('Your login session is invalid. Please log in again.');
  }

  if (!token) {
    throw new Error('Your session token is missing. Please log in again.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result as ApiResponse<T>;
}
