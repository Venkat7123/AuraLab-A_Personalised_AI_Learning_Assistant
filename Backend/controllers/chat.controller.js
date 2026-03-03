import { chatWithAI } from '../services/ai.service.js'
import * as chatService from '../services/chat.service.js'

// POST /api/chat/send — send a message and get AI response
export const sendMessage = async (req, res, next) => {
    try {
        const { threadId, message, topicTitle, subjectName, mode, language, skipAI, aiResponse: providedAiResponse } = req.body
        const userId = req.user.id

        if (!message?.trim()) return res.status(400).json({ error: 'Message is required' })

        let thread = null
        let actualThreadId = threadId

        // Create thread if no threadId provided
        if (!actualThreadId) {
            const subjectId = req.body.subjectId
            if (!subjectId) return res.status(400).json({ error: 'subjectId is required for new threads' })
            thread = await chatService.createChatThread(req.supabase, userId, subjectId, message.trim().substring(0, 50))
            actualThreadId = thread.id
        }

        // Save user message
        await chatService.saveChatMessage(req.supabase, actualThreadId, 'user', message.trim())

        let aiResponse

        if (skipAI && providedAiResponse) {
            // Skip AI call — save the provided response directly (e.g. infographic image)
            aiResponse = providedAiResponse
        } else {
            // Get conversation history for context
            const history = await chatService.getChatMessages(req.supabase, actualThreadId)

            // Get AI response
            aiResponse = await chatWithAI({
                message: message.trim(),
                history: history.map(m => ({ role: m.role, content: m.content })),
                topicTitle,
                subjectName,
                mode,
                language
            })
        }

        // Save AI response
        await chatService.saveChatMessage(req.supabase, actualThreadId, 'ai', aiResponse)

        // Touch thread updated_at
        await chatService.touchThread(req.supabase, actualThreadId)

        res.json({
            threadId: actualThreadId,
            threadName: thread?.name || null,
            response: aiResponse
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/chat/threads/:subjectId — get all threads for a subject
export const getThreads = async (req, res, next) => {
    try {
        const data = await chatService.getChatThreads(req.supabase, req.user.id, req.params.subjectId)
        res.json(data)
    } catch (err) {
        next(err)
    }
}

// GET /api/chat/messages/:threadId — get messages for a thread
export const getMessages = async (req, res, next) => {
    try {
        const data = await chatService.getChatMessages(req.supabase, req.params.threadId)
        res.json(data)
    } catch (err) {
        next(err)
    }
}

// PUT /api/chat/threads/:threadId — rename a thread
export const renameThread = async (req, res, next) => {
    try {
        const data = await chatService.updateThreadName(req.supabase, req.params.threadId, req.body.name)
        res.json(data)
    } catch (err) {
        next(err)
    }
}

// DELETE /api/chat/threads/:threadId — delete a thread
export const removeThread = async (req, res, next) => {
    try {
        await chatService.deleteThread(req.supabase, req.params.threadId)
        res.status(204).send()
    } catch (err) {
        next(err)
    }
}
