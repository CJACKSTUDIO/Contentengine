/**
 * Catjack Studio · Gemini multimodal analyzer.
 *
 * Two responsibilities:
 *   1. analyzeVideo(masterUrl) — uploads the Cloudinary master to the
 *      Gemini Files API, asks Gemini 2.5 Pro to extract structured
 *      hook / pacing / text / transcript / CTA fields, and returns a
 *      VideoAnalysisJson that matches the column shape on
 *      studio_inspo_videos.analysis.
 *
 *   2. bucketComments(comments) — runs Gemini 2.5 Flash over the top
 *      ~200 comments, groups them by intent ("replay-watch mentions",
 *      "tagging friends", "wants part 2", "asking how-to"), and
 *      returns CommentIntentRow-shaped output for persistence.
 *
 * Both calls request structured JSON so we never have to brittle-parse
 * model prose. Schema lives next to the function it powers.
 */

import { GoogleGenAI, Type } from '@google/genai'
import type { VideoAnalysisJson } from './types'
import { env } from './op'

let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (_client) return _client
  _client = new GoogleGenAI({ apiKey: env.gemini() })
  return _client
}

/* ─── Schema for analyzeVideo ─────────────────────────────── */

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    hookSeconds:       { type: Type.STRING, description: 'Time range of the hook, e.g. "0:00–0:03"' },
    hookPattern:       { type: Type.STRING, description: 'Short label like "big-emotion · face-zoom" or "question-hook"' },
    hookConfidence:    { type: Type.NUMBER, description: '0..1 confidence the hook lands' },
    cutsPerSecOpen:    { type: Type.NUMBER, description: 'Cuts per second across the first 5s' },
    cutsPerSecRest:    { type: Type.NUMBER, description: 'Cuts per second after 0:05' },
    onScreenText: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          t:     { type: Type.STRING, description: 'Timestamp like "0:00.4"' },
          text:  { type: Type.STRING, description: 'Verbatim text shown on screen' },
          style: { type: Type.STRING, description: 'Style descriptor, e.g. "huge yellow shake"' },
        },
        required: ['t', 'text', 'style'],
        propertyOrdering: ['t', 'text', 'style'],
      },
    },
    ctaTiming:           { type: Type.STRING, description: 'When the CTA appears, e.g. "0:08.2"' },
    ctaWording:          { type: Type.STRING, description: 'CTA copy, verbatim' },
    audioStyle:          { type: Type.STRING, description: 'narration / music / silence / mixed' },
    musicGenre:          { type: Type.STRING, description: 'Short label, e.g. "lo-fi children\'s"' },
    subjectCloseUpPct:   { type: Type.NUMBER, description: 'Percent of video where subject fills >60% of frame' },
    peakBeatTimestamp:   { type: Type.STRING, description: 'When the energy peaks, e.g. "0:05.4"' },
    transcript: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          t:    { type: Type.STRING, description: 'Timestamp like "0:00"' },
          text: { type: Type.STRING, description: 'Spoken line' },
        },
        required: ['t', 'text'],
        propertyOrdering: ['t', 'text'],
      },
    },
  },
  required: [
    'hookSeconds', 'hookPattern', 'hookConfidence',
    'cutsPerSecOpen', 'cutsPerSecRest',
    'onScreenText', 'ctaTiming', 'ctaWording',
    'audioStyle', 'musicGenre',
    'subjectCloseUpPct', 'peakBeatTimestamp',
    'transcript',
  ],
  propertyOrdering: [
    'hookSeconds', 'hookPattern', 'hookConfidence',
    'cutsPerSecOpen', 'cutsPerSecRest',
    'onScreenText', 'ctaTiming', 'ctaWording',
    'audioStyle', 'musicGenre',
    'subjectCloseUpPct', 'peakBeatTimestamp',
    'transcript',
  ],
} as const

const ANALYSIS_PROMPT = `You are analyzing a short-form social video for a kids' content studio.
Watch the video and extract the structural patterns that make it hold attention.

Be precise with timestamps (always in M:SS or M:SS.t format).
On-screen text should be verbatim.
For audioStyle pick one of: narration, music, silence, narration + music, narration + ambient.
For hookPattern, use 1-2 lowercase tags joined by " · ", e.g. "big-emotion · face-zoom".
hookConfidence is 0..1; only use >0.85 if the hook is unmistakable.
Return JSON only.`

export async function analyzeVideo(masterUrl: string): Promise<VideoAnalysisJson> {
  const c = client()

  // 1. Pull the video bytes (Cloudinary serves the MP4 directly).
  const fileRes = await fetch(masterUrl)
  if (!fileRes.ok) {
    throw new Error(`Failed to fetch master video: ${fileRes.status}`)
  }
  const buf = Buffer.from(await fileRes.arrayBuffer())

  // 2. Upload to Gemini Files API. Files API auto-cleans after 48h.
  const uploaded = await c.files.upload({
    file: new Blob([buf], { type: 'video/mp4' }),
    config: { mimeType: 'video/mp4' },
  })

  if (!uploaded.uri || !uploaded.mimeType) {
    throw new Error('Gemini file upload returned without uri')
  }

  // 3. Ask Gemini for structured analysis.
  const result = await c.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } },
          { text: ANALYSIS_PROMPT },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_SCHEMA,
      temperature: 0.2,
    },
  })

  const text = result.text
  if (!text) throw new Error('Gemini returned empty response')

  return JSON.parse(text) as VideoAnalysisJson
}

/* ─── Comment intent bucketing ────────────────────────────── */

const INTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    buckets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          bucket:        { type: Type.STRING, description: 'Concise human label, e.g. "Wants Part 2"' },
          count:         { type: Type.NUMBER, description: 'How many comments fall in this bucket' },
          example_quote: { type: Type.STRING, description: 'Most representative comment, verbatim' },
        },
        required: ['bucket', 'count', 'example_quote'],
        propertyOrdering: ['bucket', 'count', 'example_quote'],
      },
    },
    replay_signal_count: {
      type: Type.NUMBER,
      description: 'Comments mentioning replay/rewatch/"keep coming back"/"on repeat".',
    },
  },
  required: ['buckets', 'replay_signal_count'],
  propertyOrdering: ['buckets', 'replay_signal_count'],
} as const

const INTENT_PROMPT = `You're grouping social-video comments by intent for a kids' content studio.

Bucket every comment into ONE intent (multi-bucket is fine if a comment clearly fits two).
Common buckets: "Wants Part 2", "Tagging friends", "Asking how-to", "Replay mentions",
"Wholesome reaction", "Negative / off-brand", "Spam / unrelated", "Loved a specific moment".

Pick the example_quote that best represents each bucket — verbatim, truncated to 120 chars max.

replay_signal_count is the number of comments that explicitly mention re-watching
("watched 10 times", "i keep coming back", "on repeat", "still rewatching"), since that
proxies for retention when the platform doesn't expose a curve.

Output JSON only.`

interface CommentInput {
  text: string
  like_count?: number | null
  author?: string | null
}

export interface BucketedComments {
  buckets: Array<{ bucket: string; count: number; example_quote: string }>
  replay_signal_count: number
}

export async function bucketComments(comments: CommentInput[]): Promise<BucketedComments> {
  if (comments.length === 0) {
    return { buckets: [], replay_signal_count: 0 }
  }

  const c = client()
  const corpus = comments
    .slice(0, 200)
    .map((cm, i) => `[${i + 1}] ${cm.text.replace(/\s+/g, ' ').slice(0, 240)}`)
    .join('\n')

  const result = await c.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: `${INTENT_PROMPT}\n\nComments:\n${corpus}` }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: INTENT_SCHEMA,
      temperature: 0.2,
    },
  })

  const text = result.text
  if (!text) {
    return { buckets: [], replay_signal_count: 0 }
  }

  return JSON.parse(text) as BucketedComments
}
