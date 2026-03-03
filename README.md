<p align="center">
  <img src="Frontend/public/logo.png" alt="AuraLab Logo" width="80" height="80" style="border-radius: 16px;" />
</p>

<h1 align="center">AuraLab — A Personalised AI Learning Assistant</h1>

<p align="center">
  <strong>AI-powered learning platform that generates personalised curriculums, interactive lessons, quizzes, and study materials — tailored to your goals.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5-4285F4?logo=google" />
  <img src="https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?logo=supabase" />
</p>

---

## ✨ Features

### 🧠 AI-Powered Learning
- **Custom Syllabus Generation** — Describe what you want to learn and AI generates a structured, topic-by-topic curriculum
- **4-Mode Content Delivery** — Each topic is taught through 4 modes: *Explain*, *Demonstrate*, *Try*, and *Apply*
- **AI Chat Tutor** — Chat with an AI tutor that understands your topic context and adapts to your learning style
- **Smart Quizzes** — Auto-generated quizzes with instant feedback and progress tracking
- **Exam Preparation** — Generate comprehensive exam questions across all topics in a subject
- **Infographic Generation** — Create visual infographics from chat conversations using Pollinations.ai

### 📄 Document Intelligence
- **PDF Upload & Analysis** — Upload PDF syllabi and AI extracts structured topics automatically
- **Homework Scanner** — Scan homework/assignments via image upload and get AI-powered solutions
- **PDF Export** — Download chat conversations and notes as formatted PDF documents

### 📊 Progress & Engagement
- **Streak Tracking** — Daily learning streak with a visual heatmap grid (GitHub-style)
- **Topic Progress** — Track quiz scores and completion across all topics
- **Onboarding Flow** — Personalised setup wizard that captures learning goals, style, and experience level

### 🔐 Authentication
- **Email/Password** authentication via Supabase
- **Google OAuth** integration
- **Forgot/Reset Password** flow with email verification
- **Profile Management** — Update display name, change password, delete account

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Lucide Icons |
| **Backend** | Express 5 (ES Modules), Node.js |
| **AI Engine** | Google Gemini 2.5 Flash (dual API key rotation with fallback) |
| **Database** | Supabase (PostgreSQL + Row Level Security) |
| **Auth** | Supabase Auth (Email/Password + Google OAuth) |
| **Storage** | Supabase Storage (images, PDFs) |
| **Image Gen** | HuggingFace API |
| **PDF Parsing** | pdf-parse |
| **Image Processing** | Sharp |
| **PDF Export** | jsPDF |

---

## 📁 Project Structure

```
AuraLab/
├── Backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client (anon + admin)
│   ├── controllers/             # Route handlers
│   ├── middleware/
│   │   └── error.middleware.js   # Global error handler
│   ├── routes/                  # API route definitions
│   │   ├── ai.routes.js         # Syllabus generation
│   │   ├── chat.routes.js       # AI chat
│   │   ├── content.routes.js    # Topic content & quizzes
│   │   ├── image.routes.js      # Infographic generation
│   │   ├── pdf.routes.js        # PDF upload & parsing
│   │   ├── profile.routes.js    # User profile CRUD
│   │   ├── scan.routes.js       # Homework scanning
│   │   ├── streak.routes.js     # Daily streak tracking
│   │   ├── subject.routes.js    # Subject CRUD
│   │   └── topic.routes.js      # Topic management
│   ├── services/                # Business logic
│   │   ├── ai.service.js        # Gemini AI integration
│   │   ├── chat.service.js      # Chat history
│   │   ├── content.service.js   # Content generation & storage
│   │   ├── image.service.js     # Pollinations integration
│   │   ├── profile.service.js   # Profile management
│   │   └── ...                  # Subject, topic, streak, etc.
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point
│
├── Frontend/
│   ├── public/
│   │   ├── logo.png             # App logo
│   │   └── background-tech.mp4  # Background video
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js          # Landing page
│   │   │   ├── login/           # Login page
│   │   │   ├── signup/          # Registration page
│   │   │   ├── onboarding/      # User preference wizard
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── add/             # Create new subject wizard
│   │   │   ├── profile/         # Profile settings
│   │   │   ├── subjects/[id]/
│   │   │   │   ├── page.js      # Subject detail (topics list)
│   │   │   │   ├── playground/  # Learning playground
│   │   │   │   ├── homework/    # Homework chat assistant
│   │   │   │   └── settings/    # Subject configuration
│   │   │   ├── forgot-password/ # Password reset request
│   │   │   ├── update-password/ # Password reset confirmation
│   │   │   ├── globals.css      # Global styles & design tokens
│   │   │   └── layout.js        # Root layout
│   │   ├── components/
│   │   │   ├── Navbar.js        # Navigation bar
│   │   │   ├── StreakGrid.js    # Streak heatmap
│   │   │   ├── SubjectCard.js   # Subject card component
│   │   │   ├── ThemeProvider.js # Dark theme provider
│   │   │   └── playground/
│   │   │       ├── LeftPanel.js   # Chat history & library
│   │   │       ├── CenterPanel.js # Main chat & content area
│   │   │       └── RightPanel.js  # Notes, quiz & exam prep
│   │   ├── context/
│   │   │   ├── AuthContext.js   # Auth state management
│   │   │   └── SubjectContext.js # Subject state management
│   │   ├── utils/
│   │   │   ├── api.js           # API fetch wrapper
│   │   │   └── generatePdf.js   # Chat-to-PDF conversion
│   │   └── lib/
│   │       └── supabase.js      # Frontend Supabase client
│   └── vercel.json              # Vercel deployment config
│
├── .gitignore
└── README.md
```

---

## 🎯 The Learning Playground

The heart of AuraLab is the **3-panel Playground** — an interactive split-view interface for immersive learning:

| Panel | Purpose |
|---|---|
| **Left Panel** | Chat history, search, and generated image library |
| **Center Panel** | AI chat interface with topic content in 4 modes (Explain → Demonstrate → Try → Apply), infographic generation, and message context |
| **Right Panel** | Notes editor, quiz mode with instant grading, and exam preparation |

### Content Generation Modes
1. **Explain** — Detailed concept explanations  
2. **Demonstrate** — Examples, code samples, real-world applications  
3. **Try** — Practice exercises and guided challenges  
4. **Apply** — Real-world projects and application scenarios

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** 18+
- **Supabase** project with the required tables
- **Google Gemini API** keys (2 recommended for rate-limit rotation)
- **Pollinations API** key (optional, for infographic generation)

### 1. Clone the Repository

```bash
git clone https://github.com/Venkat7123/AuraLab-A_Personalised_AI_Learning_Assistant.git
cd AuraLab-A_Personalised_AI_Learning_Assistant
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Google Gemini AI (2 keys for rate-limit rotation)
GEMINI_API_KEY1=your_gemini_api_key_1
GEMINI_API_KEY2=your_gemini_api_key_2

# Pollinations (optional — for infographic generation)
HUGGING_FACE_TOKEN=your_hugging_face_token

# Server
PORT=5000
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd Frontend
npm install
```

Create a `.env.local` file in the `Frontend/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 🗄️ Database Schema (Supabase)

The following tables are required in your Supabase project:

| Table | Description |
|---|---|
| `subjects` | User-created subjects with name, goal, language, duration, level, intensity |
| `topics` | Ordered topics within a subject |
| `topic_contents` | AI-generated content per topic per mode (explain/demonstrate/try/apply) |
| `quiz_questions` | Auto-generated quiz questions per topic |
| `user_topic_progress` | Quiz scores and completion status |
| `chat_histories` | Saved chat conversations |
| `chat_messages` | Individual chat messages within histories |
| `user_streak` | Daily activity tracking for streak calculation |
| `user_preferences` | Onboarding preferences (role, goal, level, time, style) |
| `generated_images` | Metadata for AI-generated infographics |

---

## 🌐 API Endpoints

### AI & Content
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/generate-syllabus` | Generate AI-powered syllabus |
| `GET` | `/api/content/:topicId/:mode` | Get topic content by mode |
| `GET` | `/api/content/:topicId/quiz` | Get quiz questions |
| `POST` | `/api/content/:topicId/quiz/submit` | Submit quiz results |
| `GET` | `/api/content/:subjectId/exam` | Generate exam questions |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/send` | Send message to AI tutor |
| `GET` | `/api/chat/histories/:subjectId` | Get chat histories |
| `POST` | `/api/chat/histories` | Create new chat history |

### Subjects & Topics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/subjects` | List all subjects |
| `POST` | `/api/subjects` | Create new subject |
| `DELETE` | `/api/subjects/:id` | Delete subject |
| `PUT` | `/api/subjects/:id/reset` | Reset subject with new config |

### Images & Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/images/generate` | Generate infographic |
| `POST` | `/api/pdf/upload-pdf` | Upload and parse PDF |
| `POST` | `/api/scan/solve` | Scan and solve homework |

### User
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/streak` | Get streak data |
| `GET` | `/api/profile` | Get user profile |
| `PUT` | `/api/profile/name` | Update display name |
| `DELETE` | `/api/profile/account` | Delete account |

---

## 🚀 Deployment

### Frontend (Vercel)
The frontend includes a `vercel.json` configured for Next.js. Deploy by connecting your GitHub repo to [Vercel](https://vercel.com).

### Backend
Deploy the Express backend to any Node.js hosting platform (Railway, Render, Fly.io, etc.). Make sure to set all environment variables from the `.env` section above.

> **Important:** Update the CORS origin in `Backend/app.js` from `http://localhost:3000` to your production frontend URL.

---

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Venkat7123">Venkat</a>
</p>
