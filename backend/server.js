const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./src/config/db");
const publicRoutes = require("./src/routes/publicRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.argv.includes("--dev");
const serveFrontend = process.env.SERVE_FRONTEND !== "false";
const clientDir = path.join(__dirname, "..", "client");
const distDir = path.join(clientDir, "dist");
const frontendOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Add it to backend/.env before starting the server.");
  process.exit(1);
}

const adminPassword = process.env.ADMIN_PASSWORD || "";
if (adminPassword && !/^\$2[aby]\$/.test(adminPassword)) {
  console.warn("ADMIN_PASSWORD is plain text. Replace it with a bcrypt hash before handing this site to the client.");
}

connectDB();

app.use(
  helmet({
    contentSecurityPolicy: isDev
      ? false
      : {
          useDefaults: true,
          directives: {
            "script-src": ["'self'"],
            "style-src": ["'self'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "img-src": ["'self'", "data:", "https:"],
            "media-src": ["'self'", "blob:", "data:"],
            "connect-src": ["'self'", ...frontendOrigins],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'"],
            "frame-ancestors": ["'self'"]
          }
        }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || frontendOrigins.length === 0 || frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please wait and try again." }
});

app.get("/", (req, res) => {
  if (!serveFrontend || isDev) {
    return res.json({
      status: "ok",
      service: "Arogya Dental API",
      health: "/api/health"
    });
  }
  return res.sendFile(path.join(distDir, "index.html"));
});

app.use("/api", apiLimiter);
app.use("/api/admin/login", loginLimiter);
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

const start = async () => {
  if (isDev && serveFrontend) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root: clientDir,
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (serveFrontend && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({ message: "Origin not allowed." });
    }
    res.status(500).json({ message: "Something went wrong. Please try again." });
  });

  app.listen(PORT, () => {
    console.log(`Arogya Dental Clinic running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
