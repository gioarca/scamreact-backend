const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // Testo del messaggio truffa (già redatto lato client o qui)
    message: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000,
      trim: true,
    },

    // Tipo di truffa
    scamType: {
      type: String,
      required: true,
      enum: [
        "phishing_smishing",
        "impersonation_bank",
        "fake_investment",
        "marketplace_scam",
        "job_scam",
        "romance_scam",
        "tech_support",
        "other",
      ],
    },

    // Canale attraverso cui è arrivata
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

    // Fascia di importo coinvolto (se rilevabile, altrimenti "na")
    amountRange: {
      type: String,
      enum: ["na", "lt_50", "50_200", "200_1000", "gt_1000"],
      default: "na",
    },

    // età dell'utente (non obbligatoria, ma se presente deve essere un numero valido)
    age: {
      type: Number,
      min: 18,
      max: 100,
    },

    // genere dell'utente (non obbligatorio, ma se presente deve essere uno dei valori specificati)
    gender: {
      type: String,
      enum: ["male", "female", "non_binary", "prefer_not_to_say"],
    },

    // regione (non obbligatoria, ma se presente deve essere una stringa breve)
    location: {
      type: String,
      maxlength: 100,
      trim: true,
    },

    // data del tentativo di truffa (non obbligatoria, ma se presente deve essere una data valida)
    scamDate: {
      type: Date,
    },

    // Consenso alla condivisione pubblica anonima
    consentPublic: {
      type: Boolean,
      default: true,
    },

    // Metadati anonimi (nessun dato personale)
    meta: {
      // Paese/lingua rilevato dall'header Accept-Language
      lang: { type: String, maxlength: 10 },
      // User-agent generico (solo browser family, non versione)
      browserFamily: { type: String, maxlength: 50 },
    },

    // Data di creazione (usata per trend temporali)
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Non aggiunge updatedAt (le segnalazioni sono immutabili)
    timestamps: false,
    versionKey: false,
  },
);

// Indici per query frequenti
reportSchema.index({ scamType: 1, createdAt: -1 });
reportSchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
