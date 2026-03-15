const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const { redactSensitive } = require("../utils/redact");

// ── POST /api/reports ────────────────────────────────────────────────────────
// Salva una nuova segnalazione
router.post("/", async (req, res) => {
  try {
    const {
      message,
      scamType,
      channel,
      amountRange,
      consentPublic,
      age,
      location,
    } = req.body;

    if (!message || !scamType || !channel) {
      return res.status(400).json({ error: "Campi obbligatori mancanti." });
    }

    const safeMessage = redactSensitive(message);

    if (safeMessage.length < 10) {
      return res
        .status(400)
        .json({ error: "Messaggio troppo corto dopo la redazione." });
    }

    const lang = (req.headers["accept-language"] || "").slice(0, 10);
    const ua = req.headers["user-agent"] || "";
    const browserFamily = detectBrowserFamily(ua);

    const report = new Report({
      message: safeMessage,
      scamType,
      channel,
      amountRange,
      consentPublic: !!consentPublic,
      ...(age && { age: Number(age) }),
      ...(location && { location }),
      meta: { lang, browserFamily },
    });

    await report.save();
    res.status(201).json({ success: true, id: report._id });
  } catch (err) {
    console.error("Errore salvataggio report:", err.message);
    res.status(500).json({ error: "Errore interno del server." });
  }
});

// ── GET /api/reports ─────────────────────────────────────────────────────────
// Lista segnalazioni pubbliche con filtri opzionali
//
// Query params:
//   scamType  — filtra per tipo (es. "phishing_smishing")
//   channel   — filtra per canale (es. "whatsapp")
//   location  — filtra per regione (es. "Lombardia")
//   from      — data ISO inizio (es. "2025-01-01")
//   to        — data ISO fine
//   limit     — numero risultati (default 100, max 500)
//   page      — pagina (default 1)
router.get("/", async (req, res) => {
  try {
    const {
      scamType,
      channel,
      location,
      from,
      to,
      limit = 100,
      page = 1,
    } = req.query;

    // ── Costruzione filtro ──────────────────────────────────
    const filter = { consentPublic: true };

    if (scamType) filter.scamType = scamType;
    if (channel) filter.channel = channel;
    if (location) filter.location = { $regex: location, $options: "i" };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // ── Paginazione ─────────────────────────────────────────
    const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    // ── Query ───────────────────────────────────────────────
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select("-meta -__v") // non esporre metadati tecnici
        .sort({ createdAt: -1 }) // più recenti prima
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({
      data: reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("GET /api/reports:", err.message);
    res.status(500).json({ error: "Errore interno del server." });
  }
});

// ── GET /api/reports/stats ───────────────────────────────────────────────────
// Statistiche aggregate (usate dalla KPIBar in homepage)
router.get("/stats", async (_req, res) => {
  try {
    const [totalReports, recentReports, uniquePatterns] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 86_400_000) },
      }),
      Report.distinct("scamType").then((arr) => arr.length),
    ]);

    res.json({ totalReports, recentReports, uniquePatterns });
  } catch (err) {
    console.error("GET /api/reports/stats:", err);
    res.status(500).json({ error: "Errore interno del server." });
  }
});

// ── Helper ───────────────────────────────────────────────────────────────────
function detectBrowserFamily(ua) {
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua)) return "Safari";
  if (/Edge/i.test(ua)) return "Edge";
  return "Other";
}

module.exports = router;
