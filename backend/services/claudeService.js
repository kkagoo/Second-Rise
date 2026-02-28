const Anthropic = require('@anthropic-ai/sdk');
const { buildPrompt } = require('./promptBuilder');

const SYSTEM_PROMPT = `You are Second Rise's movement coach for women 40–60 navigating perimenopause and postmenopause. Recommend the best workout session and write the complete workout plan. Respond with ONLY valid JSON — no markdown, no code fences, no commentary outside the JSON.`;

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function parseJSON(rawText) {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function generateRecommendation(profile, checkin, readiness, priorFeedback) {
  const client = getClient();
  const userPrompt = buildPrompt(profile, checkin, readiness, priorFeedback);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = message.content[0].text;
  try {
    return parseJSON(rawText);
  } catch (err) {
    console.error('Claude JSON parse error. Raw response:', rawText);
    throw new Error('Claude returned invalid JSON. Please try again.');
  }
}

async function generateAlternativeWorkout(profile, checkin, readiness, sessionType) {
  const client = getClient();
  const basePrompt = buildPrompt(profile, checkin, readiness, null);
  const altPrompt = `${basePrompt}

OVERRIDE: The user has chosen "${sessionType}" as their session. Write a complete workout plan for this session type only.

Respond with ONLY valid JSON matching this schema:
{
  "session_type": string,
  "duration_min": number,
  "workout": {
    "warmup": [{ "name": string, "duration_sec": number, "instruction": string }],
    "main": [{ "name": string, "sets": number, "reps": number, "rest_sec": number, "form_cue": string }],
    "cooldown": [{ "name": string, "duration_sec": number, "instruction": string }]
  }
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: altPrompt }],
  });

  const rawText = message.content[0].text;
  try {
    return parseJSON(rawText);
  } catch (err) {
    console.error('Claude alt JSON parse error. Raw response:', rawText);
    throw new Error('Claude returned invalid JSON for alternative workout.');
  }
}

module.exports = { generateRecommendation, generateAlternativeWorkout };
