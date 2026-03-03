import express from 'express'
import { getProfile, updateName, updatePassword, updateEmail, deleteAccount } from '../controllers/profile.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authMiddleware, getProfile)
router.put('/name', authMiddleware, updateName)
router.put('/password', authMiddleware, updatePassword)
router.put('/email', authMiddleware, updateEmail)
router.delete('/', authMiddleware, deleteAccount)

export default router
