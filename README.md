# OCTA - AI HR Assistant & Payroll Management

A modern React dashboard for HR operations with AI-powered assistance and integrated payroll management.

## Features
- 🤖 AI HR Assistant (Claude integration ready)
- 👥 Team & Employee Management
- 💰 Payroll Processing & Management
- 📊 Dashboard Analytics
- 📋 Task Management Integration (Notion ready)
- 🔐 Secure role-based access

## Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Express.js
- **Styling**: CSS-in-JS (custom)
- **Data**: JSON (hardcoded for testing)
- **API Ready**: Claude, Notion integrations

## Installation

```bash
npm install
```

## Development

Run both client and server:
```bash
npm run dev
```

Or separately:
```bash
npm run client    # Vite dev server on port 5173
npm run server    # Express on port 3001
```

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
octa-dashboard/
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # API/backend services
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── App.jsx
│   └── main.jsx
├── server/
│   ├── index.js           # Express server
│   └── data/              # JSON data files
├── public/                # Static assets
├── vite.config.js
├── package.json
└── .env.example
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## API Endpoints

- `GET /api/employees` - List all employees
- `GET /api/payroll` - Payroll records
- `POST /api/payroll` - Create payroll
- `GET /api/teams` - Teams
- `GET /api/tasks` - Tasks

## Future Integrations
- Claude API for AI assistance
- Notion API for database sync
- SQLite for production data

---
Built with ❤️ for African tech companies
