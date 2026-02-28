export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthError";
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
