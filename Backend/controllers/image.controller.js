import { generateAndStoreImage, getGeneratedImages } from '../services/image.service.js'

// POST /api/images/generate — generate an infographic
export const generateImage = async (req, res, next) => {
    try {
        const { prompt, subjectId, topicTitle, language } = req.body
        const userId = req.user.id

        if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required' })
        if (!subjectId) return res.status(400).json({ error: 'subjectId is required' })

        const result = await generateAndStoreImage(prompt.trim(), userId, subjectId, topicTitle || '', language || 'English')
        res.json(result)
    } catch (err) {
        next(err)
    }
}

// GET /api/images/:subjectId — get all generated images for a subject
export const listImages = async (req, res, next) => {
    try {
        const data = await getGeneratedImages(req.supabase, req.user.id, req.params.subjectId)
        res.json(data)
    } catch (err) {
        next(err)
    }
}
