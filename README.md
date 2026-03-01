# AuraLab - AI-Powered Learning Assistant

AuraLab is a full-stack personalized learning platform that uses Gemini 2.5 Flash AI to generate structured syllabi, multi-mode lesson content, quizzes, AI chat tutoring, homework scanning, and AI-generated infographic images - all in your preferred language.

---

## Features

### Subject Management
- Create subjects with name, goal, study duration, level (Beginner to Expert), and intensity (Casual to Hardcore)
- Choose study language: **English, Tamil, Telugu, Kannada, Hindi**
- AI generates a full ordered syllabus automatically, or upload a PDF to extract topics, or build manually with drag-and-drop reordering
- Delete subjects from the dashboard

### AI-Powered Playground (per topic)
Five learning modes powered by Gemini 2.5 Flash:

| Mode | Description |
|---|---|
| **Explain** | Detailed concept explanation with examples and pro tips |
| **Demonstrate** | Step-by-step walkthrough with code examples |
| **Let Me Try** | 3 practice exercises (Basic to Challenge) |
| **Apply** | Real-world use cases and project challenges |
| **Test Me** | 10-question MCQ quiz - score 7/10 to unlock next topic |

- Content generated in the user's chosen language using a natural, conversational tone
- Topics are sequentially locked - pass the quiz to unlock the next
- Progress tracking per subject (complete count and percentage)
- Switch language mid-session from the topic bar
- Download any topic's full content as a formatted **PDF**

### AI Chat Tutor (Right Panel)
- Context-aware chat scoped to the current topic and subject
- Maintains conversation history across sessions (thread-based)
- **Infographic mode** - type a concept and generate an AI visual image (Gemini 2.5 Flash Image) stored in the subject library
- Rename and manage multiple chat threads per subject

### Homework Scanner
- Upload a photo of homework (image)
- Gemini Vision reads and solves the homework with step-by-step explanations
- Ask follow-up questions about the scanned content
- Full scan history stored per subject

### Exam Prep
- Generate a 20-question cross-topic exam covering the entire subject
- Each question includes an AI-generated explanation of correct and incorrect answers
- Instant score, results summary, and per-question answer review

### Learning Streak
- Daily activity tracking - quiz passes record a streak entry
- GitHub-style heatmap grid on the dashboard showing activity over time
- Current streak count displayed on the dashboard

### Profile
- View and edit display name and avatar
- Email/password auth via Supabase

### Image Library (per subject)
- All AI-generated infographics stored in Supabase Storage
- Accessible from the left sidebar library panel alongside scanned images
- Click any image to open a full-screen lightbox

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework |
| Supabase JS Client | Auth (client-side) |
| jsPDF | In-browser PDF generation |
| Lucide React | Icons |
| CSS Variables | Theming |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| Supabase (Service Role SDK) | Database + Storage |
| Google Gemini 2.5 Flash | Content, syllabus, quiz, chat, image generation |
| sharp | Image text overlay compositing |
| pdf-parse | Extract text from uploaded PDFs |
| multer | File upload handling |

---

## Project Structure

```
auralab/
├── Frontend/                     # Next.js app
│   └── src/
│       ├── app/
│       │   ├── dashboard/        # Subject list + streak heatmap
│       │   ├── add/              # Create subject wizard (3 steps)
│       │   ├── subjects/[id]/    # Subject detail + exam prep
│       │   │   ├── playground/   # 3-panel learning interface
│       │   │   ├── homework/     # Homework scanner
│       │   │   └── settings/     # Subject settings
│       │   ├── profile/          # User profile page
│       │   ├── login/
│       │   └── signup/
│       ├── components/
│       │   ├── playground/
│       │   │   ├── LeftPanel.js  # Topics syllabus + image library
│       │   │   ├── CenterPanel.js# Learning modes + quiz
│       │   │   └── RightPanel.js # AI chat + infographic generation
│       │   ├── Navbar.js
│       │   ├── SubjectCard.js
│       │   └── StreakGrid.js
│       └── utils/
│           └── api.js            # Authenticated fetch wrapper
│
└── Backend/                      # Express API
    ├── server.js
    ├── app.js                    # Route registration + CORS
    ├── config/supabase.js
    ├── routes/
    ├── controllers/
    ├── services/
    │   ├── ai.service.js         # Gemini API (syllabus, content, quiz, chat)
    │   ├── content.service.js    # Topic content generation + storage
    │   ├── image.service.js      # Gemini image gen + Supabase upload
    │   ├── chat.service.js       # Chat threads + message history
    │   ├── scan.service.js       # Homework scan history
    │   └── streak.service.js     # Daily activity tracking
    └── middleware/
        ├── auth.middleware.js    # Supabase JWT verification
        └── error.middleware.js
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/generate-syllabus` | AI syllabus generation |
| POST | `/api/ai/solve-homework` | Homework image solving (Gemini Vision) |
| POST | `/api/ai/exam` | Generate full subject exam |
| GET | `/api/subjects` | List user subjects |
| POST | `/api/subjects` | Create subject |
| DELETE | `/api/subjects/:id` | Delete subject |
| GET | `/api/content/:topicId/:mode` | Get topic content for a mode |
| POST | `/api/content/:topicId/generate` | Trigger AI content generation |
| GET | `/api/content/:topicId/quiz` | Get quiz questions |
| POST | `/api/content/:topicId/quiz-result` | Submit quiz result |
| POST | `/api/topics/:id/pass` | Mark topic as passed |
| POST | `/api/images/generate` | Generate + store infographic image |
| GET | `/api/images/:subjectId` | List generated images for a subject |
| GET | `/api/chat/threads/:subjectId` | Get chat threads |
| POST | `/api/chat/send` | Send message and get AI reply |
| GET | `/api/scan/history/:subjectId` | Get homework scan history |
| GET | `/api/user/streak` | Get streak heatmap data |
| POST | `/api/user/streak` | Record daily activity |
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |

---

## Environment Variables

### Backend - `Backend/.env`
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY1=your_gemini_key_1
GEMINI_API_KEY2=your_gemini_key_2_fallback
```

> Never commit `.env` to version control. It is already listed in `.gitignore`.

### Frontend - `Frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- [Google AI Studio](https://aistudio.google.com/app/apikey) API key (Gemini 2.5 Flash)

### 1. Run the Backend
```bash
cd Backend
npm install
npm run dev        # http://localhost:5000
```

### 2. Run the Frontend
```bash
cd Frontend
npm install
npm run dev        # http://localhost:3000
```

---

## Supabase Setup

### Database Tables
| Table | Purpose |
|---|---|
| `user_profiles` | Display name, avatar URL, streak JSON |
| `subjects` | Subject metadata (name, language, duration, etc.) |
| `topics` | Topic list + `passed` status per subject |
| `topic_contents` | AI content keyed by `(topic_id, mode, lang)` |
| `quiz_questions` | MCQ questions per topic + language |
| `chat_threads` | Chat thread metadata per subject |
| `chat_messages` | Individual chat messages |
| `scan_history` | Homework scan entries (image URL + extracted text) |
| `generated_images` | Infographic metadata (prompt, image URL, topic) |
| `exam_questions` | Generated exam questions per subject |

### Storage
- Bucket: `images` (public) - stores AI-generated infographic images
