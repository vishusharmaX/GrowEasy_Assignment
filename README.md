# GrowEasy AI-Powered CSV Importer

An intelligent, full-stack CRM data-mapping engine that allows users to upload any arbitrary/messy lead CSV file, preview it client-side, and dynamically map columns to a unified, structured CRM schema using Google Gemini.

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                  │
├────────────────────────────────────────────────────────┤
│  Step 1: Upload (Drag & Drop, Client Validations)      │
│  Step 2: Raw Preview (PapaParse, Sticky Table)         │
│  Step 3: Confirm & Live Progress Polling (Axios/Fetch) │
│  Step 4: CRM Output Table (Virtualized react-window)   │
└──────────────────────────┬─────────────────────────────┘
                           │ POST /api/import/upload
                           │ GET  /api/import/:batchId
                           ▼
┌────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js API)              │
├────────────────────────────────────────────────────────┤
│  1. upload.middleware.js (Size & MIME Check)           │
│  2. csvParser.service.js (csv-parse/sync)              │
│  3. crmExtraction.service.js                           │
│     ├── Batching Engine (size: 20)                     │
│     ├── llmClient.js (Gemini AI API Calls with Retry)  │
│     └── leadValidator.service.js (Safety Validation)   │
└──────────────────────────┬─────────────────────────────┘
                           ├──────────────────────┐
                           ▼                      ▼
               ┌──────────────────────┐ ┌──────────────────┐
               │    MongoDB Database  │ │ In-Memory Cache  │
               │   (Persistent State) │ │ (Fallback Mode)  │
               └──────────────────────┘ └──────────────────┘
```

---

## 🌟 Key Features

1. **Intelligent Mapping Prompt**: Uses a robust system prompt to enforce standard CRM fields and map arbitrary column headers dynamically.
2. **Deterministic Validator Net**: Validates lead status/source enums, parses date fields, escapes inline newlines, and rejects leads missing both phone and email.
3. **Dual-Mode Persistence**: Saves imported records to MongoDB. If MongoDB is offline, it degrades gracefully to in-memory state tracking to ensure zero import downtime.
4. **Virtualized Results Table**: Uses `react-window` to dynamically render thousands of leads instantly, maintaining 60fps scrolling.
5. **Live Processing Polling**: Backgrounds the LLM batch mapping process so the frontend can check progress updates in real time without timeouts.
6. **Dark Mode Theme**: Premium theme styling supporting persistent light and dark themes using HSL design tokens.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Key | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Express server. |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`). |
| `MONGODB_URI` | `mongodb://localhost:27017/groweasy_csv_importer` | Connection string for MongoDB. |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin allowed to request the API. |
| `LLM_PROVIDER` | `gemini` | Choice of LLM client (`gemini`, `openai`, `anthropic`). |
| `GEMINI_API_KEY` | *(Required)* | Your Google Gemini API Key. |
| `LLM_BATCH_SIZE` | `20` | Size of record chunks sent to the LLM. |
| `LLM_MAX_RETRIES` | `3` | Max retries for failed LLM calls before skipping batch. |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum uploaded file size constraint. |

### Frontend (`frontend/.env.local`)
| Key | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5000` | Deployed or local API base path. |

---

## 🚀 Local Quickstart

### Method 1: Docker Compose (Easiest)
Ensure you have Docker and Docker Compose installed.
1. Define your `GEMINI_API_KEY` in your environment or write it to a local `.env` file in the root workspace.
2. Boot services:
   ```bash
   docker-compose up --build
   ```
3. Start the React app in dev mode:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Method 2: Manual Run
#### 1. Database
Run a local MongoDB instance on port `27017`. (If omitted, the app will degrade gracefully and run in in-memory mode.)

#### 2. Backend
```bash
cd backend
npm install
# Configure your variables in .env
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install
# Configure VITE_API_BASE_URL in .env.local
npm run dev
```

---

## 🧪 Testing
Run backend unit tests to verify parser and validation logic:
```bash
cd backend
npm run test
```

---

## 📡 API Specification

### 1. Health Status check
`GET /api/health`
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-07-08T10:00:00.000Z",
  "environment": "development",
  "database": "connected",
  "llmProvider": "gemini"
}
```

### 2. Upload CSV File
`POST /api/import/upload`
- **Request**: `multipart/form-data` with `file` key containing the `.csv` file.
- **Response (Status 202 Accepted)**:
```json
{
  "batchId": "4722a578-831d-4074-b529-577884e93fca",
  "status": "processing",
  "filename": "leads_dump.csv",
  "totalRows": 45,
  "totalBatches": 3
}
```

### 3. Get Batch Status / Progress Details
`GET /api/import/:batchId`
- **Response (Status 200 OK)**:
```json
{
  "batchId": "4722a578-831d-4074-b529-577884e93fca",
  "filename": "leads_dump.csv",
  "totalRows": 45,
  "totalImported": 42,
  "totalSkipped": 3,
  "status": "completed",
  "errorMessage": null,
  "records": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "mobile_without_country_code": "9876543210",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "data_source": "leads_on_demand",
      "created_at": "2026-07-08T10:00:00.000Z"
    }
  ],
  "skipped": [
    {
      "rowIndex": 7,
      "reason": "Both email and mobile number are missing"
    }
  ]
}
```

---

## ☁️ Deployment

### Backend (Render / Heroku)
1. Deploy as a Web Service.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables in settings:
   - `GEMINI_API_KEY`
   - `LLM_PROVIDER=gemini`
   - `MONGODB_URI` (your Mongo Atlas URI)
   - `CORS_ORIGIN` (your frontend deployment URL on Vercel)

### Frontend (Vercel)
1. Import your project directory.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_API_BASE_URL` (your backend Render URL)
