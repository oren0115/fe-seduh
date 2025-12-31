# Coffee Shop POS - Frontend

Frontend aplikasi Coffee Shop POS menggunakan React + TypeScript + Vite + Shadcn UI.

## Features

- ✅ Authentication (Login/Logout)
- ✅ Dark Mode / Light Mode
- ✅ Protected Routes
- ✅ Shadcn UI Components
- ✅ TypeScript
- ✅ React Router

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` dengan API URL backend:
```
VITE_API_URL=http://localhost:3000/api
```

4. Run development server:
```bash
npm run dev
```

## Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Shadcn UI** - Component Library
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP Client
- **next-themes** - Dark Mode

## Project Structure

```
fe-pos/
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # Shadcn UI components
│   │   ├── ThemeToggle.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/      # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/           # Utilities
│   │   ├── api.ts     # Axios instance
│   │   ├── auth.ts    # Auth service
│   │   └── utils.ts   # Helper functions
│   ├── pages/         # Page components
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
```

## Default Credentials

Gunakan credentials dari backend seed script:
- Owner: `owner@coffee.com` / `password123`
- Kasir: `kasir@coffee.com` / `password123`
