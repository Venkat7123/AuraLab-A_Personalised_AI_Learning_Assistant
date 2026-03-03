// Lightweight fetch wrapper for calling the Express backend.
// Automatically attaches the Supabase access token for authentication.

import { supabase } from '@/lib/supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Helper function to get a valid session with token refresh if needed
async function getValidSession() {
  try {
    // First try to get current session
    let { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return null
    }

    // If no session, user is not logged in
    if (!session) {
      return null
    }

    // Check if token is about to expire (within 5 minutes)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at
    const timeUntilExpiry = expiresAt - now

    // If token expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 300) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        // If refresh fails, sign out the user
        await supabase.auth.signOut()
        return null
      }
      session = refreshData.session
    }

    return session
  } catch (error) {
    return null
  }
}

export async function apiFetch(path, options = {}) {
  // Get a valid session (with refresh if needed)
  const session = await getValidSession()
  const token = session?.access_token

  const fullUrl = `${API_BASE}${path}`

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    let msg = `API error ${res.status}`

    // Special handling for common HTTP status codes
    if (res.status === 401) {
      // Try to refresh the session and retry the request once
      const refreshedSession = await getValidSession()
      if (refreshedSession && options.retryCount !== 1) {
        // Retry the request with the new token
        return apiFetch(path, { ...options, retryCount: 1 })
      }
      msg = 'Authentication failed. Please log in again.'
    } else if (res.status === 404) {
      msg = `API endpoint not found: ${path}. Please check if the backend server is running.`
    } else if (res.status === 500) {
      msg = 'Internal server error. Please try again later.'
    } else {
      try {
        const body = await res.json()
        if (body.error) msg = body.error
      } catch {
        // response wasn't JSON (e.g. HTML error page) — use status text
        if (res.status >= 500) msg = 'Server is temporarily unavailable. Please try again.'
      }
    }
    throw new Error(msg)
  }

  if (res.status === 204) return null
  return res.json()
}

/**
 * Upload a file to the backend (multipart/form-data).
 * @param {string} path  – API endpoint, e.g. '/api/pdf/upload-pdf'
 * @param {File}   file  – The File object to upload
 * @returns {Promise<any>} parsed JSON response
 */
export async function apiUpload(path, file, options = {}) {
  const session = await getValidSession()
  const token = session?.access_token

  const formData = new FormData()
  formData.append('file', file)

  // Append extra fields if provided
  if (options.fields) {
    for (const [key, value] of Object.entries(options.fields)) {
      formData.append(key, value)
    }
  }

  const fullUrl = `${API_BASE}${path}`

  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!res.ok) {
    let msg = `API error ${res.status}`

    // Special handling for common HTTP status codes
    if (res.status === 401) {
      // Try to refresh the session and retry the request once
      const refreshedSession = await getValidSession()
      if (refreshedSession && options.retryCount !== 1) {
        // Retry the upload with the new token
        return apiUpload(path, file, { ...options, retryCount: 1 })
      }
      msg = 'Authentication failed. Please log in again.'
    } else if (res.status === 404) {
      msg = `API endpoint not found: ${path}. Please check if the backend server is running.`
    } else if (res.status === 500) {
      msg = 'Internal server error. Please try again later.'
    } else {
      try {
        const body = await res.json()
        if (body.error) msg = body.error
      } catch {
        if (res.status >= 500) msg = 'Server is temporarily unavailable. Please try again.'
      }
    }
    throw new Error(msg)
  }

  return res.json()
}
