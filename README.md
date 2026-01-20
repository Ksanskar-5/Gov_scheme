# 🇮🇳 Bharat Scheme Guide

An AI-powered platform to help Indian citizens discover and understand government welfare schemes they're eligible for. The platform features an intelligent chatbot that provides personalized scheme recommendations based on user profiles.

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)

## ✨ Features

- 🔍 **Smart Search** - Search government schemes by name, category, or eligibility criteria
- 🤖 **AI Chatbot** - Get personalized scheme recommendations through an intelligent chat interface
- 📊 **Detailed Information** - Comprehensive details about each scheme including benefits, eligibility, and application process
- 🏷️ **Category Filtering** - Browse schemes by categories like Education, Healthcare, Agriculture, etc.
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Query** for data fetching
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** with better-sqlite3 for database
- **Google Gemini AI** for chatbot intelligence
- **Helmet** for security
- **Express Rate Limit** for API protection

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Google Gemini API key (free tier available)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/bharat-scheme-guide.git
cd bharat-scheme-guide
```

### 2. Setup Frontend

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
```

Edit `.env` and update if needed:
```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `server/.env` and add your API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Import Scheme Data

```bash
# In the server directory
npm run import-schemes
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# From project root
npm run dev
```

### 6. Access the Application

- **Frontend:** http://localhost:5173 (or the port shown in terminal)
- **Backend API:** http://localhost:3001/api

## 📁 Project Structure

```
bharat-scheme-guide/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and API client
│   └── hooks/             # Custom React hooks
├── server/                 # Backend source code
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── models/        # Data models
│   │   └── config/        # Configuration
│   ├── data/              # Database files
│   └── scripts/           # Utility scripts
├── public/                 # Static assets
└── README.md
```

## 🔧 Available Scripts

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Start production server |
| `npm run import-schemes` | Import scheme data from CSV |
| `npm run seed` | Seed database with sample data |

## 🔑 Environment Variables

### Frontend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` |

### Backend (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_PATH` | SQLite database path | `./data/schemes.db` |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Government of India for providing scheme information
- Google for Gemini AI API
- The open-source community for the amazing tools and libraries

---

Made with ❤️ for Digital India 🇮🇳
