const Anthropic = require('@anthropic-ai/sdk');
const { buildVideoPrompt } = require('./promptBuilder');
const { getVideoById } = require('./videoLibrary');

const SYSTEM_PROMPT = `You are Second Rise's movement coach for women 40–60 navigating perimenopause and postmenopause. Your job is to pick the best workout video from a curated library and tell the user what equipment to prepare. Respond with ONLY valid JSON — no markdown, no code fences, no commentary outside the JSON.`;

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

async function generateRecommendation(profile, checkin, readiness, priorFeedback, availableVideos, biometrics = null, history = [], baseline = null, weeklySchedule = []) {
  const client = getClient();
  const userPrompt = buildVideoPrompt(profile, checkin, readiness, priorFeedback, availableVideos, biometrics, history, baseline, weeklySchedule);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = message.content[0].text;
  let parsed;
  try {
    parsed = parseJSON(rawText);
  } catch (err) {
    console.error('Claude JSON parse error:', rawText);
    throw new Error('Claude returned invalid JSON. Please try again.');
  }

  // Enrich with full video data from library
  const primaryVideo = getVideoById(parsed.primary.video_id);
  if (!primaryVideo) throw new Error(`Claude picked unknown video ID: ${parsed.primary.video_id}`);

  return {
    primary: {
      ...primaryVideo,
      reasoning:   parsed.primary.reasoning,
      weight_note: parsed.primary.weight_note,
    },
    alternatives: (parsed.alternatives || []).map((alt) => {
      const vid = getVideoById(alt.video_id);
      return vid ? { ...vid, reasoning: alt.reasoning } : null;
    }).filter(Boolean),
  };
}

module.exports = { generateRecommendation };
