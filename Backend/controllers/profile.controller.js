import * as profileService from '../services/profile.service.js'

export const getProfile = async (req, res, next) => {
    try {
        const profile = await profileService.getUserProfile(req.supabase, req.user.id)
        res.json(profile || {})
    } catch (err) {
        next(err)
    }
}

export const updateName = async (req, res, next) => {
    try {
        const { name } = req.body
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' })
        }
        const result = await profileService.updateUserName(req.supabase, req.user.id, name.trim())
        res.json(result)
    } catch (err) {
        next(err)
    }
}

export const updatePassword = async (req, res, next) => {
    try {
        const { password } = req.body
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' })
        }
        const result = await profileService.updateUserPassword(req.supabase, password)
        res.json(result)
    } catch (err) {
        next(err)
    }
}

export const updateEmail = async (req, res, next) => {
    try {
        const { email } = req.body
        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'Email is required' })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' })
        }
        const result = await profileService.updateUserEmail(req.supabase, email.trim())
        res.json(result)
    } catch (err) {
        next(err)
    }
}

export const deleteAccount = async (req, res, next) => {
    try {
        const result = await profileService.deleteUserAccount(req.supabase, req.user.id)
        res.json(result)
    } catch (err) {
        next(err)
    }
}
