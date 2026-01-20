# 🇮🇳 JanScheme Backend

AI-powered Government Scheme Advisory Platform Backend API

## 📊 Features

- **3,400+ Government Schemes** - Central and State schemes database
- **Smart Search** - Natural language query parsing
- **Eligibility Engine** - Rule-based eligibility checking
- **AI Chatbot** - Context-aware assistance (Gemini/fallback)
- **Full-Text Search** - SQLite FTS5 powered
- **User Profiles** - Profile-based recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Import schemes from CSV (3,400 schemes)
npm run import-schemes

# Start development server
npm run dev
```

### Environment Variables

Edit `.env` file:

```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key  # Optional - for AI chat
FRONTEND_URL=http://localhost:5173
```

## 📚 API Endpoints

### Schemes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/schemes` | List all schemes (paginated) |
| `GET` | `/api/schemes/:slug` | Get scheme by slug or ID |
| `GET` | `/api/schemes/search` | Search with filters |
| `GET` | `/api/schemes/stats` | Get scheme statistics |
| `GET` | `/api/schemes/filters` | Get available filter options |
| `POST` | `/api/schemes/:id/check-eligibility` | Check eligibility |

### Smart Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/search/smart` | AI-powered natural language search |
| `POST` | `/api/search/recommendations` | Get personalized recommendations |
| `GET` | `/api/search/category/:category` | Search by category |
| `GET` | `/api/search/life-event/:event` | Search by life event |
| `GET` | `/api/search/life-events` | List supported life events |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/profile` | Create user profile |
| `GET` | `/api/users/:id/profile` | Get user profile |
| `PUT` | `/api/users/:id/profile` | Update user profile |
| `GET` | `/api/users/:id/schemes` | Get saved schemes |
| `POST` | `/api/users/:id/schemes/:schemeId` | Save a scheme |
| `GET` | `/api/users/:id/recommendations` | Get recommendations |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send chat message |
| `GET` | `/api/chat/status` | Check AI availability |
| `GET` | `/api/chat/suggestions` | Get quick suggestions |

## 🔧 Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run import-schemes   # Import schemes from CSV
```

## 📁 Project Structure

```
server/
├── src/
│   ├── index.ts                 # Express server entry
│   ├── config/
│   │   └── database.ts          # SQLite configuration
│   ├── routes/
│   │   ├── schemes.ts           # Scheme endpoints
│   │   ├── search.ts            # Search endpoints
│   │   ├── users.ts             # User endpoints
│   │   └── chat.ts              # Chat endpoints
│   ├── services/
│   │   ├── schemeService.ts     # Scheme CRUD
│   │   ├── eligibilityEngine.ts # Rule-based checks
│   │   ├── queryParser.ts       # NL query parsing
│   │   ├── searchOrchestrator.ts # Smart search
│   │   ├── chatService.ts       # AI chatbot
│   │   └── userService.ts       # User management
│   ├── middleware/
│   │   └── errorHandler.ts      # Error handling
│   └── types/
│       └── index.ts             # TypeScript types
├── scripts/
│   └── importSchemes.ts         # CSV import script
├── data/
│   └── schemes.db               # SQLite database
└── package.json
```

## 🔍 Example API Calls

### Search schemes
```bash
curl "http://localhost:3001/api/schemes/search?q=farmer&category=Agriculture"
```

### Smart search (natural language)
```bash
curl -X POST "http://localhost:3001/api/search/smart" \
  -H "Content-Type: application/json" \
  -d '{"query": "my father died during construction work"}'
```

### Check eligibility
```bash
curl -X POST "http://localhost:3001/api/schemes/1/check-eligibility" \
  -H "Content-Type: application/json" \
  -d '{"age": 35, "state": "Maharashtra", "isWorker": true}'
```

### Chat with AI
```bash
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What schemes are available for farmers?",
    "context": {"currentPage": "home"}
  }'
```

## 🛡️ Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **AI**: Google Gemini (optional)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## 📊 Database Stats

After import:
- **Total Schemes**: 3,400
- **Central Schemes**: 821
- **State Schemes**: 2,579
- **Categories**: 210+

## 🔒 Security

- Rate limiting (100 requests/minute)
- CORS configured for frontend
- Helmet security headers
- Input validation with Zod

---

Made with ❤️ for India's citizens
