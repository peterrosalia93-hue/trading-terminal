import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRuntimeConfig } from "./config.mjs";
import { loadJournalSnapshot } from "./journal.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distPath = path.join(projectRoot, "dist");

const app = express();
const config = getRuntimeConfig();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port: config.port });
});

app.get("/api/dashboard", (_req, res) => {
  const snapshot = loadJournalSnapshot(config.journalPath);

  res.json({
    ...snapshot,
    config: {
      commands: config.commands
    },
    generatedAt: new Date().toISOString()
  });
});

app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(distPath, "index.html"), (error) => {
    if (error) {
      res.status(404).send(
        "Frontend build not found. Run `npm run build` for the client or `npm run dev` for local development."
      );
    }
  });
});

app.listen(config.port, () => {
  console.log(
    `VIPISI Trading Terminal server running on http://localhost:${config.port} using ${config.journalPath}`
  );
});
