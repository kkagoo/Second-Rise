// LLM-layer evals: real calls to the Claude API, run against the personas in personas.js.
// Checks two things per persona: (1) did the model pick a video that was actually in the
// filtered candidate set it was shown (no hallucination outside the safe pool), and
// (2) does the pick respect the soft guidance in the prompt (weekly balance, safety-vs-preference).
//
// Also runs every persona against two model IDs so we have real evidence, not a guess,
// on whether upgrading from claude-sonnet-4-6 to claude-sonnet-5 changes anything here.
//
// Repeated trials: model output is nondeterministic, one pass per persona only tells you
// it didn't fail *that* time. Set TRIALS to run each persona multiple times per model and
// report a pass rate instead of a single pass/fail. Defaults to 1 to keep API cost predictable;
// bump it deliberately (e.g. TRIALS=3 node backend/evals/runLLMEvals.js) when you want real
// consistency evidence, not just a single-run signal.
//
// Costs real API credits (small, ~cents per call, scales with TRIALS x personas x models).
// Usage: node backend/evals/runLLMEvals.js
//        TRIALS=3 node backend/evals/runLLMEvals.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Anthropic = require('@anthropic-ai/sdk');
const { buildVideoPrompt } = require('../services/promptBuilder');
const { getVideoById } = require('../services/videoLibrary');
const personas = require('./personas');

const SYSTEM_PROMPT = `You are Second Rise's movement coach for women 40–60 navigating perimenopause and postmenopause. Your job is to pick the best workout video from a curated library and tell the user what equipment to prepare. Respond with ONLY valid JSON — no markdown, no code fences, no commentary outside the JSON.`;

const MODELS_TO_TEST = ['claude-sonnet-4-6', 'claude-sonnet-5'];
const TRIALS = Math.max(1, parseInt(process.env.TRIALS, 10) || 1);

function parseJSON(rawText) {
  const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

async function runOne(model, persona) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userPrompt = buildVideoPrompt(
    persona.profile, persona.checkin, persona.readiness, persona.priorFeedback,
    persona.availableVideos, persona.biometrics, persona.history, persona.baseline,
    persona.weeklySchedule, persona.checkinTrend, persona.biometricTrend
  );
  const start = Date.now();
  const message = await client.messages.create({
    model, max_tokens: 2048, system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const latencyMs = Date.now() - start;
  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error(`No text block in response (block types: ${message.content.map((b) => b.type).join(', ')})`);
  let parsed;
  try {
    parsed = parseJSON(textBlock.text);
  } catch (err) {
    throw new Error(`${err.message} (stop_reason=${message.stop_reason}, output_tokens=${message.usage.output_tokens})`);
  }
  if (parsed.primary.video_id === null) {
    throw new Error(`No eligible videos: ${parsed.primary.reasoning || 'no reasoning given'}`);
  }
  const primaryVideo = getVideoById(parsed.primary.video_id);
  if (!primaryVideo) throw new Error(`Model picked unknown video ID: ${parsed.primary.video_id}`);
  const result = { primary: { ...primaryVideo, reasoning: parsed.primary.reasoning, weight_note: parsed.primary.weight_note } };
  return { result, latencyMs, usage: message.usage };
}

(async () => {
  const summary = {};
  console.log(`Running ${personas.length} personas x ${MODELS_TO_TEST.length} models x ${TRIALS} trial(s) each...`);
  for (const model of MODELS_TO_TEST) {
    summary[model] = { passed: 0, failed: 0, errored: 0, totalLatency: 0, inconsistent: 0 };
    console.log(`\n=== Model: ${model} ===\n`);
    for (const persona of personas) {
      const trialResults = [];
      for (let trial = 1; trial <= TRIALS; trial++) {
        try {
          const { result, latencyMs, usage } = await runOne(model, persona);
          const { pass, detail } = persona.check(result, persona);
          summary[model].totalLatency += latencyMs;
          if (pass) summary[model].passed++; else summary[model].failed++;
          trialResults.push(pass);
          const trialLabel = TRIALS > 1 ? ` [trial ${trial}/${TRIALS}]` : '';
          console.log(`[${pass ? 'PASS' : 'FAIL'}] ${persona.id}${trialLabel} (${latencyMs}ms, ${usage.input_tokens}in/${usage.output_tokens}out)`);
          console.log(`       ${detail}`);
        } catch (err) {
          summary[model].errored++;
          trialResults.push(null);
          const trialLabel = TRIALS > 1 ? ` [trial ${trial}/${TRIALS}]` : '';
          console.log(`[ERROR] ${persona.id}${trialLabel}: ${err.message}`);
        }
      }
      if (TRIALS > 1) {
        const passCount = trialResults.filter((r) => r === true).length;
        const isConsistent = passCount === 0 || passCount === trialResults.length;
        if (!isConsistent) summary[model].inconsistent++;
        console.log(`       -> ${persona.id}: ${passCount}/${TRIALS} trials passed${isConsistent ? '' : ' (INCONSISTENT across trials)'}\n`);
      } else {
        console.log('');
      }
    }
  }

  console.log('\n=== Summary ===');
  for (const [model, s] of Object.entries(summary)) {
    const total = s.passed + s.failed + s.errored;
    const avgLatency = s.passed + s.failed > 0 ? Math.round(s.totalLatency / (s.passed + s.failed)) : 0;
    const inconsistentNote = TRIALS > 1 ? `, ${s.inconsistent} persona(s) inconsistent across trials` : '';
    console.log(`${model}: ${s.passed}/${total} passed, ${s.failed} failed, ${s.errored} errored, avg ${avgLatency}ms${inconsistentNote}`);
  }
})();
