const configured = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

export const API_BASE = configured;

export const apiUrl = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
};
