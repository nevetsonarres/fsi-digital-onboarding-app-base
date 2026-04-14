const API_BASE = '/api/v1';

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request(path, options = {}) {
  const headers = { ...options.headers };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && accessToken) {
    // Attempt token refresh once
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
      return handleResponse(retry);
    }
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function tryRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  // Deduplicate concurrent refresh calls
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }

  const data = await refreshPromise;
  if (data?.accessToken) {
    accessToken = data.accessToken;
    return true;
  }

  // Refresh failed — clear tokens
  accessToken = null;
  localStorage.removeItem('refreshToken');
  return false;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
