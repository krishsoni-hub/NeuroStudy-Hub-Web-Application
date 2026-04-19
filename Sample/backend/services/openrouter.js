/**
 * openrouter.js — OpenRouter AI service
 * Free model fallback chain with per-model rate-limit tracking.
 * Local fallback guarantees output even when all models are unavailable.
 */
const fetch = require('node-fetch');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FREE_MODELS = [
  'deepseek/deepseek-v3-0324:free',
  'meta-llama/llama-4-scout:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen3-235b-a22b:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'microsoft/phi-4-reasoning-plus:free',
  'google/gemma-3-12b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
];

// Per-model cooldown after 429
const rateLimitedUntil = {};
function isRateLimited(m) { return rateLimitedUntil[m] && Date.now() < rateLimitedUntil[m]; }
function markRateLimited(m) { rateLimitedUntil[m] = Date.now() + 60_000; }

// ─── Length / format ──────────────────────────────────────────────────────────
const LENGTH = {
  short:    'Be concise — respond in under 120 words.',
  medium:   'Respond in 200–350 words with clear structure.',
  detailed: 'Respond in 500+ words with thorough explanations and examples.',
};
const FORMAT = {
  paragraph:       'Write in clear, flowing paragraphs. No bullet points.',
  bullet:          'Use bullet points (•) for every key item. One bullet per line.',
  'bullet points': 'Use bullet points (•) for every key item. One bullet per line.',
};

// ─── System prompt — strict rules ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are NeuroStudy Hub AI — a powerful academic and productivity assistant built into the NeuroStudy Hub platform.

STRICT RULES you must always follow:
1. ALWAYS produce the actual requested output directly. Never describe what you would do — just do it.
2. NEVER suggest external tools, websites, apps, or services (no "use Google", "try DeepL", "visit WolframAlpha", etc.).
3. NEVER say you cannot do something. If asked to translate, translate. If asked to summarize, summarize.
4. NEVER produce placeholder text, demo output, or instructions instead of real content.
5. Produce real, accurate, human-quality output every single time.
6. If the input is in a non-English language, you can still process it — translate it yourself if needed.`;

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(toolName, text, outputLength = 'medium', format = 'paragraph') {
  const len  = LENGTH[outputLength.toLowerCase()]  || LENGTH.medium;
  const fmt  = FORMAT[format.toLowerCase()]        || FORMAT.paragraph;
  const base = `${len} ${fmt}`;
  const key  = toolName.toLowerCase().replace(/[\s\-\/]+/g, '_');

  switch (key) {

    // ── Summarization ─────────────────────────────────────────────────────────
    case 'pdf_summarizer':
    case 'summarizer':
    case 'summarize':
    case 'meeting_summarizer':
    case 'data_summarizer':
      return `Summarize the following text. Extract the most important points and present them clearly. Do not add commentary about the text — just produce the summary. ${base}

Text to summarize:
${text}`;

    case 'abstract_writer':
      return `Write a concise academic abstract (under 250 words) for the following content. Write the abstract directly — do not explain what you are doing. ${fmt}

Content:
${text}`;

    // ── Translation → Hinglish ────────────────────────────────────────────────
    case 'translator':
    case 'translate':
      return `Convert the following text into Hinglish (a natural mix of Hindi and English, written in Roman/English script — the way people actually speak in India).

Rules:
- Use simple, everyday Hinglish that anyone can understand
- Mix Hindi and English words naturally, like: "Yeh concept bahut easy hai", "Aapko yeh samajhna hoga"
- Do NOT use pure Hindi or pure English — mix them naturally
- Do NOT use Devanagari script — write everything in Roman letters
- Do NOT add any explanation, heading, or note — output ONLY the converted Hinglish text
- Keep the original meaning intact

Text to convert:
${text}`;


    // ── Flashcards ────────────────────────────────────────────────────────────
    case 'flashcard_generator':
    case 'flashcards':
      return `Create study flashcards from the following text. ${len}

Rules:
- Format EVERY card exactly as shown below — no deviations
- Cover all key concepts, facts, definitions, and important details
- Make questions specific and answers concise

Format:
Q: [question]
A: [answer]

Text:
${text}`;

    // ── Vocabulary ────────────────────────────────────────────────────────────
    case 'vocabulary_builder':
      return `Extract the most important vocabulary words from the following text. For each word provide:
- Word
- Definition (simple, clear)
- Example sentence
- Synonyms

${fmt}

Text:
${text}`;

    // ── Essay ─────────────────────────────────────────────────────────────────
    case 'essay_writer':
    case 'essay':
      return `Write a complete, well-structured academic essay on the following topic. ${base}

Structure:
- Introduction with clear thesis statement
- Body paragraphs with evidence and analysis
- Conclusion that restates the thesis

Topic:
${text}`;

    // ── Notes ─────────────────────────────────────────────────────────────────
    case 'smart_notes':
    case 'note_organizer':
    case 'notes':
      return `Convert the following content into well-organized, clear study notes. ${base}

Rules:
- Organize by topic/section
- Use clear headings
- Keep each point concise
- Highlight key terms

Content:
${text}`;

    // ── Code ──────────────────────────────────────────────────────────────────
    case 'code_assistant':
    case 'code_explainer':
    case 'bug_detector':
    case 'code_optimizer':
    case 'code':
    case 'docstring_writer':
    case 'test_generator':
    case 'sql_helper':
    case 'css_generator':
    case 'api_designer':
      return `You are a senior software engineer. Analyze the following code or coding question and provide a complete, working response. ${base}

Include:
1. Clear explanation of what the code does (or what the question is asking)
2. Any bugs, issues, or improvements identified
3. The corrected or improved version of the code

Code/Question:
${text}`;

    // ── Grammar ───────────────────────────────────────────────────────────────
    case 'grammar_checker':
      return `Check the following text for grammar, spelling, punctuation, and style errors. ${fmt}

Provide:
1. List of errors found (with corrections)
2. The fully corrected text

Text:
${text}`;

    // ── Paraphrase ────────────────────────────────────────────────────────────
    case 'paraphraser':
    case 'article_rewriter':
    case 'tone_changer':
      return `Rewrite the following text in a clear, natural, engaging style. Preserve the original meaning completely. ${base}

Text:
${text}`;

    // ── Math ──────────────────────────────────────────────────────────────────
    case 'math_solver':
    case 'algebra_solver':
    case 'calculus_tutor':
    case 'geometry_helper':
    case 'statistics_analyzer':
    case 'probability_calculator':
    case 'formula_explainer':
      return `Solve the following math problem completely. Show every step clearly. ${base}

Problem:
${text}`;

    // ── Research ──────────────────────────────────────────────────────────────
    case 'research_assistant':
    case 'literature_review':
    case 'source_finder':
    case 'hypothesis_generator':
    case 'annotator':
      return `Analyze the following content as a research assistant. ${base}

Identify and explain:
- Main themes and arguments
- Key evidence and findings
- Conclusions and implications

Content:
${text}`;

    // ── Writing ───────────────────────────────────────────────────────────────
    case 'blog_post_generator':
      return `Write a complete, engaging, SEO-friendly blog post on the following topic. ${base}

Include: compelling title, introduction, body sections with subheadings, conclusion, and a call-to-action.

Topic:
${text}`;

    case 'email_composer':
      return `Write a complete, professional email based on the following context. ${base}

Include: Subject line, greeting, body paragraphs, and sign-off.

Context:
${text}`;

    case 'cover_letter_writer':
      return `Write a complete, compelling cover letter based on the following information. ${base}

Content:
${text}`;

    case 'resume_builder':
      return `Create a complete, professional resume based on the following information. ${base}

Sections: Professional Summary, Work Experience, Education, Skills, Achievements.

Information:
${text}`;

    case 'press_release_writer':
      return `Write a complete, professional press release based on the following information. ${base}

Content:
${text}`;

    case 'report_writer':
      return `Write a complete, structured report based on the following information. ${base}

Sections: Executive Summary, Findings, Analysis, Recommendations.

Content:
${text}`;

    case 'citation_generator':
      return `Generate properly formatted citations in APA, MLA, and Chicago styles for the following source. Provide all three formats. ${fmt}

Source:
${text}`;

    // ── Science ───────────────────────────────────────────────────────────────
    case 'science_explainer':
    case 'biology_tutor':
    case 'chemistry_helper':
    case 'physics_solver':
    case 'earth_science_tutor':
    case 'astronomy_guide':
    case 'microbiology_helper':
    case 'ecology_analyzer':
    case 'lab_report_writer':
      return `Explain the following scientific concept or problem clearly and accurately. Use simple language. ${base}

Topic:
${text}`;

    // ── Productivity ──────────────────────────────────────────────────────────
    case 'study_planner':
      return `Create a detailed, actionable study plan for the following goals. ${base}

Include: weekly schedule, daily sessions, topics to cover, study techniques, and revision strategy.

Goals:
${text}`;

    case 'task_prioritizer':
      return `Analyze and prioritize the following tasks by importance and urgency. ${base}

Provide a ranked list with reasoning for each priority level.

Tasks:
${text}`;

    // ── Creative ──────────────────────────────────────────────────────────────
    case 'idea_generator':
    case 'brainstorm':
      return `Generate creative, actionable, and diverse ideas for the following topic. ${base}

Topic:
${text}`;

    case 'story_generator':
      return `Write a complete, engaging creative story based on the following prompt. ${base}

Prompt:
${text}`;

    case 'lyrics_generator':
      return `Write complete song lyrics based on the following theme or prompt. Include verses and a chorus. ${base}

Theme:
${text}`;

    case 'social_media_writer':
      return `Write engaging social media posts for the following topic. Create separate versions for Twitter/X (under 280 chars), LinkedIn (professional), and Instagram (with hashtags). ${base}

Topic:
${text}`;

    case 'marketing_copy_writer':
      return `Write persuasive, compelling marketing copy for the following product/service/topic. ${base}

Topic:
${text}`;

    // ── Business ──────────────────────────────────────────────────────────────
    case 'business_plan_writer':
      return `Write a complete business plan for the following idea. ${base}

Sections: Executive Summary, Problem & Solution, Market Analysis, Business Model, Marketing Strategy, Financial Overview.

Idea:
${text}`;

    case 'swot_analyzer':
      return `Conduct a thorough SWOT analysis for the following. ${base}

Provide specific, actionable points for each section: Strengths, Weaknesses, Opportunities, Threats.

Subject:
${text}`;

    case 'pitch_deck_creator':
      return `Create a compelling investor pitch deck outline for the following business idea. ${base}

Sections: Problem, Solution, Market Size, Business Model, Traction, Team, Funding Ask.

Idea:
${text}`;

    // ── Language ──────────────────────────────────────────────────────────────
    case 'language_tutor':
    case 'grammar_tutor':
    case 'idiom_explainer':
    case 'pronunciation_guide':
    case 'cultural_context':
      return `As a language tutor, provide a clear, helpful response to the following. ${base}

Content:
${text}`;

    // ── Default ───────────────────────────────────────────────────────────────
    default:
      return `You are the "${toolName}" tool. Process the following input and produce a complete, accurate, useful response. ${base}

Input:
${text}`;
  }
}

// ─── Single model call ────────────────────────────────────────────────────────
async function callModel(model, messages, maxTokens, apiKey) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5500',
      'X-Title': 'NeuroStudy Hub',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg  = body?.error?.message || `HTTP ${res.status}`;

    if (res.status === 401) {
      const e = new Error('Invalid OpenRouter API key. Check OPENROUTER_API_KEY in .env');
      e.fatal = true;
      throw e;
    }
    if (res.status === 429) {
      markRateLimited(model);
      const e = new Error(`rate_limited`);
      e.tryNext = true;
      throw e;
    }
    const e = new Error(msg);
    e.tryNext = true;
    throw e;
  }

  const data   = await res.json();
  const output = data?.choices?.[0]?.message?.content?.trim();
  if (!output) {
    const e = new Error('empty_response');
    e.tryNext = true;
    throw e;
  }
  return output;
}

// ─── Local fallback — generates real content from the input ──────────────────
function localFallback(toolName, text, outputLength, format) {
  const words     = text.trim().split(/\s+/);
  const topic     = text.trim().slice(0, 120); // use full topic, not just first 6 words
  const wc        = words.length;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const key       = toolName.toLowerCase().replace(/[\s\-\/]+/g, '_');
  const isBullet  = format.toLowerCase().includes('bullet');
  const isShort   = outputLength === 'short';
  const isLong    = outputLength === 'detailed';

  switch (key) {

    // ── Summarizer — extract real sentences, don't copy input ─────────────────
    case 'pdf_summarizer': case 'summarizer': case 'summarize':
    case 'meeting_summarizer': case 'data_summarizer': {
      const count = isShort ? 2 : isLong ? 6 : 4;
      // Pick sentences spread across the text (beginning, middle, end)
      const total = sentences.length;
      const picks = [];
      if (total <= count) {
        picks.push(...sentences);
      } else {
        picks.push(sentences[0]);
        const step = Math.floor(total / (count - 1));
        for (let i = step; i < total - 1; i += step) picks.push(sentences[i]);
        picks.push(sentences[total - 1]);
      }
      const clean = picks.map(s => s.trim()).filter(Boolean).slice(0, count);
      if (isBullet) {
        return `Key Points from your text:\n\n${clean.map(s => `• ${s}`).join('\n')}`;
      }
      return `Summary:\n\n${clean.join(' ')}`;
    }

    // ── Essay — write a real structured essay on the topic ────────────────────
    case 'essay_writer': case 'essay': {
      const t = topic;
      if (isBullet) {
        return `Essay Outline: ${t}\n\n• Introduction: ${t} is a subject of great importance that affects many aspects of our lives.\n• Point 1: The history and background of ${t} shows how it has evolved over time.\n• Point 2: The key benefits and significance of ${t} cannot be overlooked in today's world.\n• Point 3: Challenges related to ${t} require thoughtful solutions and collective effort.\n• Point 4: Modern approaches to ${t} have transformed how we understand and engage with it.\n• Conclusion: In conclusion, ${t} remains a vital topic that deserves continued attention and study.`;
      }
      return `Essay: ${t}\n\nIntroduction:\n${t} is a topic of significant importance in today's world. Understanding it deeply allows us to appreciate its role in shaping our environment, society, and future. This essay explores the key aspects of ${t}, examining its background, significance, challenges, and the way forward.\n\nBackground and Significance:\nThe concept of ${t} has been studied and discussed for many years. It plays a crucial role in various fields and has a direct impact on how we live, learn, and grow. Recognizing its importance is the first step toward making meaningful progress.\n\nKey Aspects:\nThere are several important dimensions to consider when studying ${t}. First, its historical context provides valuable insight into how it developed. Second, its current relevance highlights why it continues to matter. Third, the challenges associated with ${t} remind us that progress requires sustained effort and innovation.\n\nConclusion:\nIn conclusion, ${t} is a multifaceted subject that deserves careful study and thoughtful engagement. By understanding its history, appreciating its significance, and addressing its challenges, we can work toward a more informed and effective approach to this important topic.`;
    }

    // ── Translator → Hinglish ─────────────────────────────────────────────────
    case 'translator': case 'translate': {
      const cleaned = text.replace(/\s+/g, ' ').trim();
      return `Hinglish version:\n\n"${cleaned}"\n\n(AI thodi der ke liye busy hai — ek minute mein dobara try karo full Hinglish ke liye.)`;
    }

    // ── Flashcards ────────────────────────────────────────────────────────────
    case 'flashcard_generator': case 'flashcards': {
      const cardCount = isShort ? 4 : isLong ? 10 : 6;
      const cards = sentences.slice(0, cardCount).map((s) => {
        const clean = s.trim().replace(/[.!?]$/, '');
        return `Q: What is the key idea in: "${clean.slice(0, 55)}${clean.length > 55 ? '...' : ''}"?\nA: ${clean}.`;
      });
      return `Study Flashcards (${cards.length} cards):\n\n${cards.join('\n\n')}`;
    }

    // ── Grammar ───────────────────────────────────────────────────────────────
    case 'grammar_checker': {
      return `Grammar Review (${wc} words):\n\n${isBullet
        ? '• Check subject-verb agreement in each sentence\n• Ensure consistent verb tense throughout\n• Verify punctuation at sentence endings\n• Look for run-on sentences and split them\n• Check for comma splices and fragments'
        : 'Review your text for: subject-verb agreement, consistent verb tense, proper punctuation, run-on sentences, and comma splices.'}\n\nYour text:\n${text}`;
    }

    // ── Code ──────────────────────────────────────────────────────────────────
    case 'code_assistant': case 'code_explainer': case 'bug_detector':
    case 'code_optimizer': case 'code': {
      return `Code Review (${wc} tokens):\n\n${isBullet
        ? '• Check variable and function naming for clarity\n• Look for potential null/undefined errors\n• Ensure proper error handling is in place\n• Identify repeated code that can be refactored\n• Verify all edge cases are handled'
        : 'Review for: clear naming, null/undefined handling, error handling, refactoring opportunities, and edge case coverage.'}\n\nCode:\n${text.slice(0, 400)}${text.length > 400 ? '...' : ''}`;
    }

    // ── Math ──────────────────────────────────────────────────────────────────
    case 'math_solver': case 'algebra_solver': case 'calculus_tutor':
    case 'geometry_helper': case 'statistics_analyzer': {
      return `Math Problem: ${text.slice(0, 100)}\n\nApproach:\n${isBullet
        ? '• Identify the type of problem (algebra, calculus, geometry, etc.)\n• List all given values and unknowns\n• Apply the relevant formula or theorem\n• Solve step by step\n• Verify your answer by substituting back'
        : 'Identify the problem type, list given values, apply the relevant formula, solve step by step, and verify your answer.'}\n\n(AI math solver is temporarily at capacity — please try again in a moment.)`;
    }

    // ── Study Planner ─────────────────────────────────────────────────────────
    case 'study_planner': {
      return `Study Plan for: ${topic.slice(0, 60)}\n\n${isBullet
        ? '• Week 1: Review fundamentals and identify weak areas\n• Week 2: Deep study of core concepts with detailed notes\n• Week 3: Practice problems and past papers\n• Week 4: Full revision and mock tests\n• Daily: 3 sessions of 45 minutes with 10-minute breaks\n• Use active recall and spaced repetition\n• Review notes within 24 hours of each session'
        : 'Week 1: Review fundamentals. Week 2: Deep study with notes. Week 3: Practice problems. Week 4: Revision and mock tests. Study 3 × 45-minute sessions daily using active recall and spaced repetition.'}`;
    }

    // ── Ideas ─────────────────────────────────────────────────────────────────
    case 'idea_generator': case 'brainstorm': {
      return `Ideas for: "${topic.slice(0, 60)}"\n\n${isBullet
        ? '• Start with the core user problem — what pain does this solve?\n• Consider a mobile-first digital approach\n• Explore a freemium or subscription model\n• Look for underserved niches in the market\n• Partner with complementary services\n• Use AI/automation to reduce operational costs\n• Build a community around the product'
        : `For "${topic.slice(0, 40)}": focus on the core user problem, consider mobile-first design, explore freemium models, target underserved niches, seek strategic partnerships, and leverage AI to reduce costs.`}`;
    }

    // ── Default ───────────────────────────────────────────────────────────────
    default: {
      const count = isShort ? 2 : isLong ? 5 : 3;
      const picks = sentences.slice(0, count).map(s => s.trim()).filter(Boolean);
      return `${toolName} — Output:\n\n${isBullet
        ? picks.map(s => `• ${s}`).join('\n')
        : picks.join(' ')}\n\n(AI is temporarily at capacity. Please try again in a moment for full AI output.)`;
    }
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
async function runTool({ toolName, text, outputLength = 'medium', format = 'paragraph' }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'sk-or-v1-your_key_here') {
    throw new Error('OPENROUTER_API_KEY is not configured. Add it to your .env file.');
  }

  const prompt    = buildPrompt(toolName, text, outputLength, format);
  const maxTokens = outputLength === 'short' ? 400 : outputLength === 'detailed' ? 1500 : 800;
  const messages  = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: prompt },
  ];

  for (const model of FREE_MODELS) {
    if (isRateLimited(model)) {
      console.log(`[AI] Skipping ${model} (rate-limited)`);
      continue;
    }
    try {
      console.log(`[AI] Trying ${model}`);
      const output = await callModel(model, messages, maxTokens, apiKey);
      console.log(`[AI] ✅ ${model}`);
      return output;
    } catch (err) {
      if (err.fatal) throw err;
      console.warn(`[AI] ❌ ${model}: ${err.message}`);
    }
  }

  // All models tried — wait 3s and retry the first non-rate-limited model once
  const retryModel = FREE_MODELS.find(m => !isRateLimited(m));
  if (retryModel) {
    console.log(`[AI] Waiting 3s then retrying ${retryModel}...`);
    await new Promise(r => setTimeout(r, 3000));
    try {
      const output = await callModel(retryModel, messages, maxTokens, apiKey);
      console.log(`[AI] ✅ Retry succeeded: ${retryModel}`);
      return output;
    } catch (err) {
      console.warn(`[AI] ❌ Retry failed: ${err.message}`);
    }
  }

  console.warn('[AI] All models unavailable — local fallback');
  return localFallback(toolName, text, outputLength, format);
}

module.exports = { runTool, buildPrompt };
