const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CLOUDFLARE_KV_NAMESPACE_ID}`;
const headers = { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` };

export async function kvPut(slug: string, value: object) {
  await fetch(`${CF_BASE}/values/${slug}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

export async function kvDelete(slug: string) {
  await fetch(`${CF_BASE}/values/${slug}`, { method: "DELETE", headers });
}
