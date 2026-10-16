import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiKey = process.env.RENDER_API_KEY;

if (!apiKey) {
  console.error("Set RENDER_API_KEY first (Render Dashboard → Account Settings → API Keys).");
  process.exit(1);
}

const envPath = path.join(root, "backend", ".env");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const frontendUrl = process.env.FRONTEND_URL || "https://arogya-dental-clinic.vercel.app";
const repo = process.env.RENDER_REPO || "kartikeypant18/arogya-dental-clinic";
const branch = process.env.RENDER_BRANCH || "master";

const headers = {
  Authorization: `Bearer ${apiKey}`,
  Accept: "application/json",
  "Content-Type": "application/json"
};

const envVars = [
  { key: "NODE_ENV", value: "production" },
  { key: "SERVE_FRONTEND", value: "false" },
  { key: "FRONTEND_URL", value: frontendUrl },
  { key: "MONGODB_URI", value: env.MONGODB_URI },
  { key: "JWT_SECRET", value: env.JWT_SECRET },
  { key: "ADMIN_EMAIL", value: env.ADMIN_EMAIL || "arogyadental1991@gmail.com" },
  { key: "ADMIN_PASSWORD", value: env.ADMIN_PASSWORD },
  { key: "CLINIC_EMAIL", value: env.CLINIC_EMAIL || "arogyadental1991@gmail.com" },
  { key: "CLINIC_PHONE", value: env.CLINIC_PHONE || "9411540073" },
  { key: "BREVO_API_KEY", value: env.BREVO_API_KEY || "" },
  { key: "BREVO_SENDER_NAME", value: env.BREVO_SENDER_NAME || "Arogya Dental" },
  { key: "BREVO_SENDER_EMAIL", value: env.BREVO_SENDER_EMAIL || "arogyadental1991@gmail.com" }
];

const payload = {
  type: "web_service",
  name: "arogya-dental-api",
  ownerId: process.env.RENDER_OWNER_ID || undefined,
  repo,
  autoDeploy: "yes",
  branch,
  rootDir: "",
  serviceDetails: {
    env: "node",
    region: "singapore",
    plan: "free",
    buildCommand: "npm install",
    startCommand: "node backend/server.js",
    healthCheckPath: "/api/health",
    numInstances: 1
  },
  envVars
};

const response = await fetch("https://api.render.com/v1/services", {
  method: "POST",
  headers,
  body: JSON.stringify(payload)
});

const text = await response.text();
if (!response.ok) {
  console.error("Render create failed:", response.status, text);
  process.exit(1);
}

const data = JSON.parse(text);
const service = data.service || data;
const serviceId = service.id || data.id;
const url = service.serviceDetails?.url || service.url || `https://arogya-dental-api.onrender.com`;
console.log(JSON.stringify({ serviceId, url, name: service.name || "arogya-dental-api" }, null, 2));
