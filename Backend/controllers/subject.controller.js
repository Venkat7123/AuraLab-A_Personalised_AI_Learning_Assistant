import * as subjectService from '../services/subject.service.js'
import { translateTopics } from '../services/translation.service.js'

export const getSubjects = async (req, res, next) => {
  try {
    const data = await subjectService.getSubjects(req.supabase, req.user.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getSubject = async (req, res, next) => {
  try {
    const data = await subjectService.getSubject(req.supabase, req.user.id, req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createSubject = async (req, res, next) => {
  try {
    const subject = await subjectService.createSubject(req.supabase, req.user.id, req.body)
    res.status(201).json(subject)
  } catch (err) {
    next(err)
  }
}

export const updateSubject = async (req, res, next) => {
  try {
    const data = await subjectService.updateSubject(req.supabase, req.user.id, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const deleteSubject = async (req, res, next) => {
  try {
    await subjectService.deleteSubject(req.supabase, req.user.id, req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const resetSubject = async (req, res, next) => {
  try {
    const data = await subjectService.resetAndUpdateSubject(req.supabase, req.user.id, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const translateTopicsForSubject = async (req, res, next) => {
  try {
    const { lang } = req.query
    if (!lang) {
      return res.status(400).json({ error: 'Language parameter required' })
    }

    const LANG_MAP = {
      'en': 'English',
      'ta': 'Tamil',
      'hi': 'Hindi',
      'kn': 'Kannada',
      'te': 'Telugu',
    }
    
    const targetLanguage = LANG_MAP[lang] || 'English'
    const subject = await subjectService.getSubject(req.supabase, req.user.id, req.params.id)
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' })
    }

    const translatedTopics = await translateTopics(subject.topics || [], targetLanguage)
    
    res.json({
      ...subject,
      topics: translatedTopics
    })
  } catch (err) {
    next(err)
  }
}