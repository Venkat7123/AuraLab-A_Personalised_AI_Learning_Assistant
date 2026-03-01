import { supabaseAdmin } from '../config/supabase.js'
import sharp from 'sharp'

// NEW 2026 Routing URL
const HF_MODEL = 'black-forest-labs/FLUX.1-schnell'
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`

/**
 * Overlay a title and subtitle onto an image buffer using sharp + SVG.
 * Works with any language/script since SVG text uses system fonts.
 */
async function overlayText(imageBuffer, title, subtitle, language) {
    const width = 1024
    const height = 1024

    // Escape XML special characters
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const safeTitle = esc(title).substring(0, 80)
    const safeSubtitle = subtitle ? esc(subtitle).substring(0, 100) : ''

    const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Bottom gradient bar -->
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.75)" />
        </linearGradient>
      </defs>
      <rect x="0" y="${height - 180}" width="${width}" height="180" fill="url(#grad)" />
      
      <!-- Title text -->
      <text x="${width / 2}" y="${height - 80}" text-anchor="middle"
            font-family="Arial, Helvetica, Noto Sans, sans-serif"
            font-size="36" font-weight="bold" fill="white"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
        ${safeTitle}
      </text>
      
      ${safeSubtitle ? `
      <!-- Subtitle text -->
      <text x="${width / 2}" y="${height - 40}" text-anchor="middle"
            font-family="Arial, Helvetica, Noto Sans, sans-serif"
            font-size="22" fill="rgba(255,255,255,0.85)">
        ${safeSubtitle}
      </text>` : ''}
    </svg>`

    return sharp(imageBuffer)
        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
        .png()
        .toBuffer()
}

/**
 * Generate an infographic image using Hugging Face Inference API, store in Supabase.
 * @param {string} prompt - The image description
 * @param {string} userId - The user's ID
 * @param {string} subjectId - The subject ID
 * @param {string} topicTitle - Current topic for context
 * @returns {{ imageUrl: string, prompt: string }}
 */
export const generateAndStoreImage = async (prompt, userId, subjectId, topicTitle = '', language = 'English') => {
    const HF_TOKEN = process.env.HUGGING_FACE_TOKEN
    if (!HF_TOKEN) throw new Error('HUGGING_FACE_TOKEN is not configured')

    const fullPrompt = `A flat vector illustration depicting the concept of ${prompt}, minimalist icons and shapes, solid white background, smooth gradients, simple color palette, abstract visual representation, pictogram style, absolutely no text no letters no numbers no writing no words no characters no symbols no typography`

    console.log('Generating image from Hugging Face Inference API...')

    let response
    for (let attempt = 1; attempt <= 3; attempt++) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        try {
            response = await fetch(HF_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'image/png',
                },
                body: JSON.stringify({
                    inputs: fullPrompt,
                    parameters: {
                        width: 1024,
                        height: 1024,
                        negative_prompt: 'text, words, letters, numbers, writing, typography, captions, labels, watermark, signature, alphabet, characters, font, handwriting',
                    },
                }),
                signal: controller.signal,
            })
            clearTimeout(timeoutId)

            if (response.ok) break

            const errorBody = await response.text()
            console.error(`Attempt ${attempt}: Error ${response.status} - ${errorBody}`)

            // If the model is loading, wait longer before retrying
            if (response.status === 503) {
                const wait = attempt * 10000
                console.log(`Model is loading, waiting ${wait / 1000}s before retry...`)
                await new Promise(r => setTimeout(r, wait))
            } else if (attempt < 3) {
                await new Promise(r => setTimeout(r, 3000))
            }
        } catch (fetchErr) {
            clearTimeout(timeoutId)
            console.error(`Attempt ${attempt}: ${fetchErr.message}`)
            if (attempt < 3) await new Promise(r => setTimeout(r, 3000))
        }
    }

    if (!response || !response.ok) {
        throw new Error(`Image generation failed. Hugging Face returned ${response?.status || 'No Response'}`)
    }

    const rawBuffer = Buffer.from(await response.arrayBuffer())
    console.log('Image generated, size:', rawBuffer.length, 'bytes')

    // Overlay title + topic text in the user's preferred language
    const titleText = prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt
    const subtitleText = topicTitle || ''
    const buffer = await overlayText(rawBuffer, titleText, subtitleText, language)
    const contentType = 'image/png'
    console.log('Text overlay applied, final size:', buffer.length, 'bytes')

    // Upload to Supabase "images" bucket
    const fileName = `${userId}/${subjectId}/${Date.now()}-infographic.jpg`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('images')
        .upload(fileName, buffer, { contentType, upsert: false })

    if (uploadError) {
        console.error('Image upload error:', uploadError)
        throw new Error('Failed to store image')
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(uploadData.path)

    const imageUrl = urlData?.publicUrl
    console.log('Image stored at:', imageUrl)

    // Save metadata to DB for library retrieval
    await supabaseAdmin
        .from('generated_images')
        .insert([{
            user_id: userId,
            subject_id: subjectId,
            prompt: prompt.substring(0, 200),
            image_url: imageUrl,
            topic_title: topicTitle
        }])

    return { imageUrl, prompt }
}

/**
 * Get all generated images for a subject
 */
export const getGeneratedImages = async (supabase, userId, subjectId) => {
    const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', userId)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}
