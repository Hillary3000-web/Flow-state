<div align="center">

# ⚡ FlowState

**Execute with Consistency**

A psychologically optimized productivity platform designed for students, developers, and founders who want to build consistent habits and get things done.

[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-F55036?style=flat-square)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-a78bfa?style=flat-square)](LICENSE)

🔗 **[Live Demo](https://flow-state-liart.vercel.app/)** · 🐛 **[Report Bug](https://github.com/Hillary3000-web/Flow-state/issues)** · ✨ **[Request Feature](https://github.com/Hillary3000-web/Flow-state/issues)**

</div>

---

## 📋 Overview

FlowState is a full-stack productivity platform that goes beyond simple to-do lists. It combines **task management**, **focus sessions** (Pomodoro), **time-block scheduling**, **goal tracking**, **analytics**, and an **AI productivity assistant** into a single, cohesive experience — all wrapped in a premium dark-themed UI with glassmorphism and micro-animations.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🤖 AI Chatbot** | Groq-powered productivity assistant (Llama 3.3 70B) with contextual advice |
| **📋 Smart Tasks** | Priority levels (P1–P4), energy tagging, due dates, quick capture (⌘K) |
| **⏱️ Focus Mode** | Pomodoro timer with distraction logging and session analytics |
| **📅 Time Blocking** | Visual daily schedule with deep work, meeting, break, and task blocks |
| **🎯 Goals** | North-star objectives with progress tracking and project linking |
| **📊 Analytics** | Completion trends, burn-down charts, energy distribution, priority breakdown |
| **🔔 Notifications** | Real-time alerts via Django Channels (WebSocket) |
| **🌙 Theme Toggle** | Dark/light mode with smooth animated switch |
| **📱 Fully Responsive** | Optimized for mobile, tablet, and desktop viewports |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Django 5** | Web framework |
| **Django REST Framework** | RESTful API |
| **SimpleJWT** | Token-based authentication |
| **Django Channels + Redis** | WebSocket support for real-time notifications |
| **Celery + Redis** | Async task processing |
| **PostgreSQL (Supabase)** | Production database |
| **Groq API** | AI chatbot (Llama 3.3 70B) |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **Vite 7** | Build tool & dev server |
| **Framer Motion** | Animations & transitions |
| **Zustand** | Lightweight state management |
| **React Query** | Server-state caching |
| **Recharts** | Data visualization |
| **React Icons** | Icon library |
| **React Hot Toast** | Toast notifications |

### Deployment
| Service | Purpose |
|---------|---------|
| **Render** | Backend hosting (Django API) |
| **Vercel** | Frontend hosting (React SPA) |
| **Supabase** | PostgreSQL database (persistent, free tier) |

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Hillary3000-web/Flow-state.git
cd Flow-state
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
# Note: On Windows, daphne/Twisted may require Visual C++ Build Tools

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables below)
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start the server
python manage.py runserver 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at **http://localhost:5173**

### 4. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
GROQ_API_KEY=your-groq-api-key-here
```

> **Getting a Groq API Key (free):** Sign up at [console.groq.com](https://console.groq.com) → API Keys → Create API Key

---

## 🌐 Deployment

### Backend (Render)

1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo, set root directory to `backend/`
4. Set build command: `./build.sh`
5. Set start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
6. Add environment variables:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Your Django secret key (required — app will crash without it) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `flow-state-api.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://flow-state-liart.vercel.app` |
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL (e.g. from [Upstash](https://upstash.com)) |
| `GROQ_API_KEY` | Your Groq API key |

> **Note:** `REDIS_URL` is required for the WebSocket channel layer (real-time notifications). You can get a free Redis instance from [Upstash](https://upstash.com).

### Frontend (Vercel)

1. Import the repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend/`
3. Add environment variable: `VITE_API_URL` = `https://flow-state-api.onrender.com`

### Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Connect** → copy the **Transaction Pooler URI**
3. Replace `[YOUR-PASSWORD]` with your database password
4. Set as `DATABASE_URL` on Render

---

## 🤖 AI Chatbot

FlowState includes a built-in **AI productivity assistant** powered by [Groq](https://groq.com) (Llama 3.3 70B model).

**Features:**
- 💬 Floating chat widget accessible from every page
- 🧠 Contextual productivity advice (task planning, habits, focus, goals)
- 📝 Conversation history maintained per session
- ⚡ Fast responses via Groq's inference engine
- 🔒 Secure — API key never exposed to the client (server-side proxy)

**Architecture:**
```
Frontend (React) → Django API (/api/chatbot/) → Groq API → Response
```

The chatbot endpoint is JWT-protected, so only authenticated users can interact with the AI.

---

## 📁 Project Structure

```
Flow-state/
├── backend/
│   ├── apps/
│   │   ├── users/          # Custom user model, auth endpoints
│   │   ├── tasks/          # Task CRUD, quick capture, completion
│   │   ├── schedule/       # Time-block scheduling, risk detection
│   │   ├── focus/          # Pomodoro sessions, distraction logging
│   │   ├── habits/         # Habit tracking & streaks
│   │   ├── analytics/      # Trends, burn-down, time allocation
│   │   ├── chatbot/        # AI chatbot (Groq/Llama 3.3 integration)
│   │   └── notifications/  # WebSocket real-time alerts (Redis channel layer)
│   ├── common/             # Shared utilities, pagination
│   ├── config/             # Django settings, URL routing, ASGI
│   ├── build.sh            # Render build script
│   ├── requirements.txt    # Python dependencies
│   └── manage.py
│
├── frontend/
│   ├── public/
│   │   ├── og-image.png    # Social media preview image
│   │   ├── robots.txt      # Search engine crawl rules
│   │   └── sitemap.xml     # Site map for SEO
│   ├── src/
│   │   ├── api/            # Axios API layer
│   │   ├── components/
│   │   │   ├── chat/       # AIChatbot floating widget
│   │   │   ├── layout/     # Sidebar, Header, MainLayout
│   │   │   └── tasks/      # QuickCapture modal
│   │   ├── hooks/          # useResponsive, useWebSocket
│   │   ├── pages/          # Dashboard, Tasks, Goals, Schedule,
│   │   │                   # Focus, Analytics, Settings, Login, Register
│   │   ├── stores/         # Zustand stores (auth, UI)
│   │   ├── index.css       # Design tokens & global styles
│   │   ├── App.jsx         # Router configuration
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vercel.json         # Vercel SPA routing config
│   └── vite.config.js
│
├── .gitattributes          # Line ending rules (LF for shell scripts)
├── README.md
└── .gitignore
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/login/` | Obtain JWT tokens |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `GET` | `/api/auth/me/` | Get current user |
| `PATCH` | `/api/auth/me/` | Update profile |
| `POST` | `/api/auth/change-password/` | Change password |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks/` | List tasks (filterable) |
| `POST` | `/api/tasks/` | Create task |
| `POST` | `/api/tasks/quick-capture/` | Quick capture |
| `POST` | `/api/tasks/{id}/complete/` | Mark complete |
| `DELETE` | `/api/tasks/{id}/` | Delete task |

### Focus Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/focus/sessions/` | Start session |
| `PATCH` | `/api/focus/sessions/{id}/` | End session |
| `GET` | `/api/focus/stats/` | Focus statistics |

### AI Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chatbot/` | Send message to AI assistant |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/overview/` | Dashboard stats |
| `GET` | `/api/analytics/trends/` | Completion trends |
| `GET` | `/api/analytics/burndown/` | Burn-down data |
| `GET` | `/api/analytics/time-allocation/` | Priority & energy breakdown |

---

## 🎨 Design System

FlowState uses a custom design system built with CSS custom properties:

- **Color palette**: Zinc-based dark theme with purple/violet accent (`#7c3aed`)
- **Typography**: Inter (Google Fonts) — 300 to 800 weights
- **Components**: Glassmorphism cards, gradient buttons, focus-glow inputs
- **Layout**: Responsive grid system with `useResponsive()` hook
- **Animations**: Framer Motion page transitions, spring toggles, micro-interactions

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| **Mobile** | < 640px | Sidebar overlay, stacked grids, compact padding |
| **Tablet** | 640–1024px | Hybrid layout, adjusted spacing |
| **Desktop** | ≥ 1024px | Full sidebar, multi-column grids |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🔒 Security

- **SECRET_KEY**: Required via environment variable — app crashes in production without it (no insecure fallback)
- **CORS**: Restricted to the production frontend domain only
- **ALLOWED_HOSTS**: Strictly limited to the Render domain
- **WebSocket Auth**: JWT token required for WebSocket connections
- **API Auth**: All endpoints (except registration/login) require JWT authentication
- **robots.txt**: Blocks crawlers from authenticated routes (`/dashboard`, `/tasks`, etc.)

---

<div align="center">

**Built with ❤️ for productivity enthusiasts**

[Report Bug](https://github.com/Hillary3000-web/Flow-state/issues) · [Request Feature](https://github.com/Hillary3000-web/Flow-state/issues)

</div>
