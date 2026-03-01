import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { generateImage, listImages } from '../controllers/image.controller.js'

const router = express.Router()

router.post('/generate', authMiddleware, generateImage)
router.get('/:subjectId', authMiddleware, listImages)

export default router
