import { GoogleGenerativeAI } from "@google/generative-ai"

// Key1 → content creation & syllabus generation
const genAI1 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY1)
// Key2 → chat & homework scanning (now also used as fallback)
const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY2)

// Helper for artificial delay
const delay = (ms) => new Promise(res => setTimeout(res, ms))

// Generic wrapper to handle rate limits (429) & server errors (503) with automatic key rotation
const callGeminiWithFallback = async (modelOptions, generationFn) => {
  try {
    const model1 = genAI1.getGenerativeModel(modelOptions)
    return await generationFn(model1)
  } catch (err) {
    const errMsg = err.message || ''
    // If it's a quota/rate limit error, try the fallback key
    if (errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('quota') || errMsg.includes('503')) {
      console.warn(`⚠️ Gemini API Key 1 hit quota/error (${errMsg}). Switching to Key 2 fallback...`)
      await delay(2000) // Brief pause before retry
      try {
        const model2 = genAI2.getGenerativeModel(modelOptions)
        return await generationFn(model2)
      } catch (fallbackErr) {
        console.error('❌ Both Gemini API keys failed:', fallbackErr.message)
        throw new Error(`AI Generation failed (Both keys exhausted). Error: ${fallbackErr.message}`)
      }
    }
    throw err
  }
}

export const generateSyllabus = async ({
  name,
  goal,
  duration,
  level,
  intensity,
  language
}) => {

  const lang = language || 'English'

  const prompt = `
You are an expert curriculum designer.

Create a structured learning syllabus for:

Subject: ${name}
Goal: ${goal || "General mastery"}
Duration: ${duration} weeks
Level: ${level}
Intensity: ${intensity}
Language: ${lang}

Rules:
- Divide logically and progressively
- Keep realistic for duration
- Titles must be short
- ALL topic titles MUST be written in ${lang} language
- Return ONLY JSON
- No explanation
- Format:
[
  { "title": "Topic 1 in ${lang}" },
  { "title": "Topic 2 in ${lang}" }
]
`

  const result = await callGeminiWithFallback(
    { model: "gemini-2.5-flash" },
    (model) => model.generateContent(prompt)
  )

  const text = result.response.text()

  // Clean Gemini output if wrapped in markdown
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    throw new Error("Gemini returned invalid JSON")
  }
}


export const generateTopicContent = async ({ topicTitle, subjectName, mode, language }) => {
  const lang = language || 'English'

  const modeInstructions = {
    explain: `Explain the topic "${topicTitle}" in detail as part of the subject "${subjectName}".
Include:
- A clear introduction to the concept
- Key concepts broken down simply
- Detailed explanation with examples
- Common patterns and best practices
- A pro tip at the end

Use markdown formatting with headers (##), bold (**text**), bullet points, and blockquotes (> for tips).`,

    demonstrate: `Create a practical demonstration/walkthrough for the topic "${topicTitle}" as part of "${subjectName}".
Include:
- A step-by-step example walkthrough
- Code examples or practical demonstrations where appropriate (use \`\`\` code blocks)
- Clear explanations of what each step does
- Key takeaways at the end

Use markdown formatting with headers (##), code blocks, bold text, and numbered steps.`,

    try: `Create practice exercises for the topic "${topicTitle}" as part of "${subjectName}".
Include:
- 3 exercises of increasing difficulty (Basic, Intermediate, Challenge)
- Clear instructions for each exercise
- Hints where helpful
- A goal statement for the learner

Use markdown formatting with headers (##), numbered lists, blockquotes (> for hints), and bold text.`,

    apply: `Explain real-world applications of the topic "${topicTitle}" from "${subjectName}".
Include:
- 3 real-world use cases (industry, startups, everyday products)
- How to apply this knowledge practically
- A step-by-step guide to apply it in projects
- A challenge for the learner

Use markdown formatting with headers (##), emoji icons, bold text, and numbered steps.`
  }

  const prompt = `
You are a friendly, expert tutor who explains things in simple, everyday language.

${modeInstructions[mode] || modeInstructions.explain}

CRITICAL LANGUAGE RULES:
- Write EVERYTHING in ${lang} language
- Use natural, casual, everyday spoken style of ${lang} — like how a friend would explain it
- Do NOT use formal, textbook, or literary ${lang}
- Use simple words that anyone can understand
- If ${lang} is not English, still use ${lang} script throughout (do not transliterate to English)
- Technical terms can stay in English but explanations must be in ${lang}
- Make it feel warm, encouraging, and conversational

Return ONLY the markdown content. No extra explanation or wrapping.
`

  const result = await callGeminiWithFallback(
    { model: "gemini-2.5-flash" },
    (model) => model.generateContent(prompt)
  )
  return result.response.text()
}


export const generateQuizQuestions = async ({ topicTitle, subjectName, language }) => {
  const lang = language || 'English'

  const prompt = `
You are an expert quiz creator.

Create 10 multiple-choice questions to test knowledge on:
Topic: "${topicTitle}"
Subject: "${subjectName}"

CRITICAL LANGUAGE RULES:
- Write ALL questions and ALL options in ${lang} language
- Use natural, casual, everyday spoken style of ${lang}
- Do NOT use formal or textbook ${lang}
- Technical terms can stay in English but the rest must be in ${lang}

Rules:
- Each question has exactly 4 options
- Only 1 correct answer per question
- Questions should test real understanding, not just memorization
- Mix easy, medium, and hard questions
- Return ONLY valid JSON, no explanation

Format:
[
  {
    "question": "Question text in ${lang}",
    "options": ["Option A in ${lang}", "Option B in ${lang}", "Option C in ${lang}", "Option D in ${lang}"],
    "correct_index": 0
  }
]
`

  const result = await callGeminiWithFallback(
    { model: "gemini-2.5-flash" },
    (model) => model.generateContent(prompt)
  )
  const text = result.response.text()

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  try {
    const questions = JSON.parse(cleaned)
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Empty quiz array")
    }
    return questions
  } catch (err) {
    throw new Error("Gemini returned invalid JSON for quiz questions")
  }
}


export const generateExamQuestions = async ({ topicTitles, subjectName, language }) => {
  const lang = language || 'English'

  const topicsList = topicTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const prompt = `
You are an expert exam creator.

Create 20 multiple-choice questions for a comprehensive exam on:
Subject: "${subjectName}"

The exam should cover ALL of these topics:
${topicsList}

CRITICAL LANGUAGE RULES:
- Write ALL questions, ALL options, and ALL explanations in ${lang} language
- Use natural, casual, everyday spoken style of ${lang}
- Technical terms can stay in English but everything else must be in ${lang}

Rules:
- Each question has exactly 4 options
- Only 1 correct answer per question
- Spread questions evenly across ALL topics
- Mix easy, medium, and hard questions
- Each question MUST have an "explanation" field that explains:
  - WHY the correct answer is right
  - WHY the other options are wrong (briefly)
  - Keep explanations concise (2-3 sentences)
- Return ONLY valid JSON, no explanation

Format:
[
  {
    "question": "Question text in ${lang}",
    "options": ["Option A in ${lang}", "Option B in ${lang}", "Option C in ${lang}", "Option D in ${lang}"],
    "correct_index": 0,
    "explanation": "Explanation in ${lang} about why option A is correct and others are not.",
    "topic": "Topic title this question is from"
  }
]
`

  const result = await callGeminiWithFallback(
    { model: "gemini-2.5-flash" },
    (model) => model.generateContent(prompt)
  )
  const text = result.response.text()

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  try {
    const questions = JSON.parse(cleaned)
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Empty exam array")
    }
    return questions
  } catch (err) {
    throw new Error("Gemini returned invalid JSON for exam questions")
  }
}


export const generateSyllabusFromPDFText = async (text) => {

  // Trim large PDFs (important)
  const trimmedText = text.slice(0, 15000)

  const prompt = `
You are an expert curriculum analyzer.

From the following book content,
extract structured learning topics.

Rules:
- Logical progression
- Clean titles
- No explanation
- Return ONLY JSON

Format:
[
  { "title": "Topic 1" },
  { "title": "Topic 2" }
]

Content:
${trimmedText}
`

  const result = await callGeminiWithFallback(
    { model: "gemini-2.5-flash" },
    (model) => model.generateContent(prompt)
  )

  const raw = result.response.text()

  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    throw new Error("Gemini returned invalid JSON for PDF syllabus")
  }
}


export const solveHomeworkFromImage = async (imageBuffer, mimeType, question = '', language = 'English') => {
  const model = genAI2.getGenerativeModel({ model: "gemini-2.5-flash" })

  const langInstruction = language && language !== 'English'
    ? `\n\nIMPORTANT: Provide your ENTIRE response in ${language} language. All explanations, steps, and tips must be in ${language}.`
    : ''

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: mimeType,
    },
  }

  let prompt
  if (question && question.trim()) {
    prompt = `You are an expert tutor who helps students understand their homework.

Look at this homework image carefully.

The student has the following question about it:
"${question.trim()}"

Please answer the student's specific question based on the homework image. Provide:
1. A clear, direct answer to their question
2. Step-by-step explanation where relevant
3. Additional context or tips that would help them understand better

Format your response in clean markdown with headers where needed.
Use **bold** for key terms and formulas.
If it's a math problem, show all work clearly.
If it's a written question, provide a well-structured answer.

Be encouraging and educational in your tone.${langInstruction}`
  } else {
    prompt = `You are an expert tutor who helps students understand their homework.

Look at this homework image carefully and provide:
1. Identify each question or problem shown
2. Provide a clear, step-by-step solution for each
3. Explain the reasoning behind each step so the student can learn

Format your response in clean markdown with headers for each question.
Use **bold** for key terms and formulas.
If it's a math problem, show all work clearly.
If it's a written question, provide a well-structured answer.

Be encouraging and educational in your tone.${langInstruction}`
  }

  const result = await callGeminiWithFallback(
    { model: "gemini-2.5-flash" },
    (model) => model.generateContent([prompt, imagePart])
  )
  return result.response.text()
}

export const chatWithAI = async ({ message, history = [], topicTitle, subjectName, mode, language = 'English' }) => {
  const model = genAI2.getGenerativeModel({ model: "gemini-2.5-flash" })

  const langInstruction = language && language !== 'English'
    ? `\nIMPORTANT: You MUST respond ENTIRELY in ${language}. Use natural, colloquial ${language} — the kind people actually speak day to day.`
    : ''

  const systemPrompt = `You are an expert, friendly AI tutor helping a student learn.

Subject: ${subjectName || 'General'}
Current Topic: ${topicTitle || 'General'}
Current Mode: ${mode || 'explain'}

Rules:
- Be concise but thorough
- Use examples and analogies to explain concepts
- If the student asks something off-topic, gently redirect them back to the subject
- Format responses in clean markdown with **bold** for key terms
- Use bullet points and numbered lists for clarity
- Be encouraging and supportive${langInstruction}`

  // Build conversation history for context
  const contents = []

  // Add system context as first user message
  contents.push({ role: 'user', parts: [{ text: systemPrompt }] })
  contents.push({ role: 'model', parts: [{ text: 'Understood! I\'m ready to help you learn. Ask me anything!' }] })

  // Add conversation history (last 10 messages for context window)
  const recentHistory = history.slice(-10)
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })
  }

  // Add current message
  contents.push({ role: 'user', parts: [{ text: message }] })

  const result = await callGeminiWithFallback(
    { model: "gemini-2.5-flash" },
    (model) => model.generateContent({ contents })
  )
  return result.response.text()
}
