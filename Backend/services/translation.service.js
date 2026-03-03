import { callGeminiWithFallback } from './ai.service.js'

const LANG_MAP = {
  'en': 'English',
  'ta': 'Tamil',
  'hi': 'Hindi',
  'kn': 'Kannada',
  'te': 'Telugu',
}

const LANG_NAMES = {
  'English': 'English',
  'Tamil': 'Tamil',
  'Hindi': 'Hindi',
  'Kannada': 'Kannada',
  'Telugu': 'Telugu',
}

export const translateTopics = async (topics, targetLanguageName) => {
  if (!topics || topics.length === 0) return topics
  if (targetLanguageName === 'English') return topics

  const titles = topics.map(t => t.title)
  const prompt = `Translate these topic titles to ${targetLanguageName} ONLY. Maintain the exact meaning. Return ONLY the translations separated by newlines, no numbering or extra text.

Topic titles:
${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`

  try {
    const result = await callGeminiWithFallback(
      { model: 'gemini-2.5-flash' },
      async (genAI) => {
        const chat = genAI.startChat({
          history: [],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.3,
          },
        })
        const msg = await chat.sendMessage(prompt)
        return msg.response.text()
      }
    )

    const translations = result.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    return topics.map((topic, i) => ({
      ...topic,
      title: translations[i] || topic.title,
    }))
  } catch (error) {
    console.error('Topic translation failed:', error.message)
    return topics
  }
}
