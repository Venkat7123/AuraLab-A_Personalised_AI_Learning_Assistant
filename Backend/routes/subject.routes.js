import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  resetSubject,
  translateTopicsForSubject
} from '../controllers/subject.controller.js'

const router = express.Router()

router.get('/', authMiddleware, getSubjects)
router.get('/:id', authMiddleware, getSubject)
router.get('/:id/translate', authMiddleware, translateTopicsForSubject)
router.post('/', authMiddleware, createSubject)
router.patch('/:id', authMiddleware, updateSubject)
router.put('/:id/reset', authMiddleware, resetSubject)
router.delete('/:id', authMiddleware, deleteSubject)

export default router
