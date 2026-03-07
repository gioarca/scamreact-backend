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

    // Validazione base
    if (!message || !scamType || !channel) {
      return res.status(400).json({ error: "Campi obbligatori mancanti." });
    }

    // Redazione server-side (secondo layer di sicurezza)
    const safeMessage = redactSensitive(message);

    if (safeMessage.length < 10) {
      return res
        .status(400)
        .json({ error: "Messaggio troppo corto dopo la redazione." });
    }

    // Metadati anonimi dall'header (nessun IP salvato)
    const lang = (req.headers["accept-language"] || "").slice(0, 10);
    const ua = req.headers["user-agent"] || "";
    const browserFamily = detectBrowserFamily(ua);

    const report = new Report({
      message: safeMessage,
      scamType,
      channel,
      amountRange,
      consentPublic,
      ...(age && { age: Number(age) }),
      ...(location && { location }),
      consentPublic: !!consentPublic,
      meta: { lang, browserFamily },
    });

    await report.save();
    res.status(201).json({ success: true, id: report._id });
  } catch (err) {
    console.error("Errore salvataggio report:", err.message);
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

// Helper: rileva solo la famiglia del browser (nessuna versione)
function detectBrowserFamily(ua) {
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua)) return "Safari";
  if (/Edge/i.test(ua)) return "Edge";
  return "Other";
}

module.exports = router;
