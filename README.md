# ScamRadar — Backend API

Backend Express + MongoDB per raccogliere segnalazioni di truffe in forma anonima.

## Struttura

```
scam-radar-backend/
├── server.js              # Entry point
├── .env.example           # Template variabili d'ambiente
├── models/
│   └── Report.js          # Schema Mongoose
├── routes/
│   └── reports.js         # Endpoint API
└── utils/
    └── redact.js          # Redazione dati sensibili
```

## Setup rapido

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Configura le variabili d'ambiente

```bash
cp .env.example .env
# Apri .env e inserisci la tua MONGO_URI da MongoDB Atlas
```

### 3. Ottieni la MONGO_URI da Atlas

1. Vai su [mongodb.com/atlas](https://mongodb.com/atlas) → crea account gratuito
2. Crea un cluster (M0 free tier)
3. **Database Access** → crea utente con password
4. **Network Access** → aggiungi `0.0.0.0/0` (o il tuo IP)
5. **Connect** → "Connect your application" → copia la stringa

### 4. Avvia il server

```bash
# Sviluppo (auto-reload)
npm run dev

# Produzione
npm start
```

---

## Endpoint

### `POST /api/reports`

Crea una nuova segnalazione anonima.

**Body JSON:**

```json
{
  "message": "Testo del messaggio sospetto...",
  "scamType": "phishing_smishing",
  "channel": "sms",
  "consentPublic": true
}
```

**Risposta 201:**

```json
{ "success": true, "id": "664abc123..." }
```

---

### `GET /api/reports/stats`

Statistiche aggregate (pubbliche).

**Risposta:**

```json
{
  "total": 142,
  "byType": [{ "_id": "phishing_smishing", "count": 58 }, ...],
  "byChannel": [{ "_id": "sms", "count": 71 }, ...]
}
```

---

### `GET /api/reports/recent`

Ultimi 20 report pubblici (senza testo del messaggio).

---

### `GET /health`

Health check del server.

---

## Privacy by design

- ❌ Nessun IP salvato
- ❌ Nessun testo del messaggio nella risposta API
- ✅ Redazione automatica server-side (email, telefoni, CF, IBAN, carte)
- ✅ Solo metadati anonimi (lingua browser, famiglia browser)
- ✅ I report con `consentPublic: false` non compaiono mai nelle route pubbliche

# Project info

Hi! This is a back-end API that manage data of users, products and orders.
It's meant to be used for a plant-based e-commerce.

# Getting Started

1. Clone the repository on your local pc.
2. Download and install Postman.
3. Open the Visual Studio Code and press `npm i`.
4. Wait until the process is done.
5. Choose to run the code through the command npm start.
6. In the end follow the instructions below. Enjoy!

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser and keep open Postman to see changes.

The page will reload when you make changes and you may also see any errors in the console.
