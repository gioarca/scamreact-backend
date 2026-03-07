require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const reportsRouter = require("./routes/reports");

// ── Validazione variabili d'ambiente ────────────
const REQUIRED_ENV = ["PSW", "ALLOWED_ORIGINS"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Variabile d'ambiente mancante: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;
const PSW = process.env.PSW;
const MONGO_URI = `mongodb+srv://infoscamreact_db_user:${PSW}@scamreact.me91xzg.mongodb.net/?appName=scamreact`;
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) =>
  o.trim(),
);

// ── App ─────────────────────────────────────────
const app = express();

// ── Middleware ──────────────────────────────────
app.use(express.json({ limit: "20kb" }));

app.use(
  cors({
    origin: (origin, callback) => {
      // Permetti richieste senza origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origine non consentita → ${origin}`));
      }
    },
    methods: ["GET", "POST"],
  }),
);

// ── Routes ──────────────────────────────────────
app.use("/api/reports", reportsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 404
app.use((_req, res) => res.status(404).json({ error: "Rotta non trovata." }));

// Errori Express generici
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Errore interno del server." });
});

// ── MongoDB + avvio ─────────────────────────────
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connesso");

    app.listen(PORT, () => {
      console.log(`🚀 Server in ascolto su http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Errore avvio:", err.message);
    process.exit(1);
  }
}

// Gestione crash non catturati
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err.message);
  process.exit(1);
});

startServer();
