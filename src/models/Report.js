const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────
    // CORE
    // ─────────────────────────────────────────────

    // Testo della segnalazione (redatto lato client prima dell'invio)
    message: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000,
      trim: true,
    },

    // Tipo di truffa — allineato alle 13 categorie del form
    scamType: {
      type: String,
      required: true,
      enum: [
        "account_identity_theft", // Furto d'identità / account
        "payment_diversion", // Deviazione pagamenti (BEC)
        "purchase_sale_scam", // Acquisto / Vendita
        "charity_donation_scam", // Falsa beneficenza
        "investment_scam", // Investimenti
        "job_scam", // Lavoro falso
        "recovery_scam", // Recupero fondi
        "phishing", // Phishing / Smishing
        "romance_scam", // Sentimentale / Romantico
        "threat_intimidation_scam", // Minacce / Estorsione
        "unexpected_money_scam", // Soldi inattesi (eredità, vincite)
        "home_renovation_scam", // Lavori in casa
        "card_cloning_scam", // Clonazione carta / skimmer
        "other", // Altro
      ],
    },

    // Canale attraverso cui è arrivata la truffa
    channel: {
      type: String,
      required: true,
      enum: [
        "whatsapp",
        "sms",
        "telegram",
        "email",
        "phone_call",
        "instagram",
        "facebook",
        "website",
        "other",
      ],
    },

    // ─────────────────────────────────────────────
    // EVIDENZA DI CONTATTO
    // Identificatore pubblico fornito dall'utente
    // per il canale scelto. Valore in base al canale:
    //   phone/whatsapp/sms/telegram → numero di telefono
    //   email                       → indirizzo email mittente
    //   website                     → URL del sito
    //   instagram/facebook          → username o URL profilo
    // ─────────────────────────────────────────────

    contactEvidence: {
      type: String,
      maxlength: 500,
      trim: true,
      default: null,
    },

    // ─────────────────────────────────────────────
    // DATI OPZIONALI UTENTE
    // ─────────────────────────────────────────────

    // Fascia di importo coinvolto
    amountRange: {
      type: String,
      enum: ["na", "lt_50", "50_200", "200_1000", "gt_1000"],
      default: "na",
    },

    // Età dell'utente (non obbligatoria)
    age: {
      type: Number,
      min: 18,
      max: 100,
      default: null,
    },

    // Regione italiana (non obbligatoria)
    location: {
      type: String,
      maxlength: 100,
      trim: true,
      default: null,
    },

    // ─────────────────────────────────────────────
    // MICRO-SURVEY — validazione funzione "Verifica"
    // Registra se l'utente ha cercato online il contatto
    // prima di segnalarlo. Usato per misurare la domanda
    // della futura funzione di ricerca nel database.
    // ─────────────────────────────────────────────

    priorSearch: {
      type: String,
      enum: [
        "found", // Sì, ha trovato altre segnalazioni online
        "not_found", // Sì, ma non ha trovato nulla
        "no_search", // No, non ha cercato
      ],
      default: null,
    },

    // ─────────────────────────────────────────────
    // CONSENSO E METADATI
    // ─────────────────────────────────────────────

    // Consenso alla condivisione pubblica anonima
    consentPublic: {
      type: Boolean,
      default: true,
    },

    // Metadati anonimi — nessun dato personale
    meta: {
      lang: { type: String, maxlength: 10 }, // Accept-Language header
      browserFamily: { type: String, maxlength: 50 }, // Solo famiglia browser, no versione
    },

    // Timestamp di creazione — immutabile, usato per trend temporali
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Le segnalazioni sono immutabili, updatedAt non serve
    versionKey: false,
  },
);

// ─────────────────────────────────────────────
// INDICI
// ─────────────────────────────────────────────

// Query frequenti per dashboard e trend
reportSchema.index({ scamType: 1, createdAt: -1 });
reportSchema.index({ channel: 1, createdAt: -1 });
reportSchema.index({ priorSearch: 1, createdAt: -1 }); // analisi domanda funzione Verifica
reportSchema.index({ contactEvidence: 1 }); // ricerca per numero/URL/email/username (futura funzione Verifica)
reportSchema.index({ channel: 1, contactEvidence: 1 }); // query per tipo: "tutti i profili Instagram segnalati"

module.exports = mongoose.model("Report", reportSchema);
