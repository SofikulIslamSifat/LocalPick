// Shared API utilities used across the auth, public and shop UIs.
// Picks a sensible base URL automatically (honours window.API_BASE first).
const SHOP_API_BASE =
  window.API_BASE ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://localpick25.vercel.app/api");
window.API_BASE = SHOP_API_BASE;

function getToken() {
  return localStorage.getItem("localpick_token") || "";
}

function saveAuth(user, token) {
  if (user) localStorage.setItem("localpick_user", JSON.stringify(user));
  if (token) localStorage.setItem("localpick_token", token);
}

function getShopId() {
  return localStorage.getItem("localpick_shopId") || "";
}

function setShopId(id) {
  if (id) localStorage.setItem("localpick_shopId", id);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("localpick_user") || "{}");
  } catch (_e) {
    return {};
  }
}

function qs(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${SHOP_API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function renderStatus(text, type = "info") {
  const el = document.querySelector(".page-status");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  el.classList.toggle("error", type === "error");
  el.classList.toggle("success", type === "success");
}
