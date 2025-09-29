// src/api/pexipClient.js
export async function apiGet(path, token) {
  const res = await fetch(path, { method: 'GET', headers: { token } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

export async function apiPost(path, token) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', token } });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.text().catch(() => '');
}

export async function apiPostJSON(path, token, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', token }, body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json().catch(() => ({}));
}
