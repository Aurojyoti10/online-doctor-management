
const API_URL = 'http://localhost:5001/api/doctor-portal';

export async function doctorPortalApi<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const stored = localStorage.getItem('careconnect_auth');

  if (!stored) throw new Error('Please log in again.');

  let token: string | null;
  try {
    token = JSON.parse(stored).token ?? null;
  } catch {
    throw new Error('Invalid login session. Please log in again.');
  }

  if (!token) throw new Error('Session token missing. Please log in again.');

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

  return result;
}
