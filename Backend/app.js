import express from 'express'
import cors from 'cors'

import subjectRoutes from './routes/subject.routes.js'
import topicRoutes from './routes/topic.routes.js'
import aiRoutes from './routes/ai.routes.js'
import profileRoutes from './routes/profile.routes.js'
import streakRoutes from './routes/streak.routes.js'
import { errorHandler } from './middleware/error.middleware.js'
import pdfRoutes from "./routes/pdf.routes.js"
import scanRoutes from "./routes/scan.routes.js"
import contentRoutes from "./routes/content.routes.js"
import chatRoutes from "./routes/chat.routes.js"
import imageRoutes from "./routes/image.routes.js"

const app = express()

// ── Middleware ──────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// ── Routes ─────────────────────────────────────────────────
app.use('/api/subjects', subjectRoutes)
app.use('/api/topics', topicRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/user/streak', streakRoutes)
app.use("/api/pdf", pdfRoutes)
app.use("/api/scan", scanRoutes)
app.use("/api/content", contentRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/images", imageRoutes)
// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── Error handler (must be last) ───────────────────────────
app.use(errorHandler)

export default app