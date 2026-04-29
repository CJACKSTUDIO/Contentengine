import { execa } from 'execa'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

interface IngestArgs {
  url: string
  folder: string
}

export interface IngestResult {
  platform: 'tiktok' | 'youtube' | 'instagram' | 'unknown'
  platform_video_id: string
  channel: string | null
  channel_id: string | null
  title: string | null
  description: string | null
  duration_seconds: number | null
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  thumbnail: string | null
  /** Cloudinary URLs for the master video + thumbnail. */
  master_url: string
  thumbnail_url: string
  /** Top comments (up to 200, where the platform exposes them). */
  comments: Array<{
    id: string
    author: string | null
    text: string
    like_count: number | null
    timestamp: number | null
  }>
  /** Raw yt-dlp metadata, kept for replay/debug. */
  raw_meta: Record<string, unknown>
}

function detectPlatform(url: string): IngestResult['platform'] {
  const lower = url.toLowerCase()
  if (lower.includes('tiktok.com')) return 'tiktok'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('instagram.com')) return 'instagram'
  return 'unknown'
}

/**
 * Pulls a public TikTok / YouTube / Reels video to a temp dir, uploads
 * the master MP4 + thumbnail to Cloudinary, then returns structured
 * metadata + top comments (where exposed). Tempdir is cleaned up on
 * both success and failure paths.
 */
export async function ingest({ url, folder }: IngestArgs): Promise<IngestResult> {
  const tmp = await mkdtemp(join(tmpdir(), 'catjack-ingest-'))

  try {
    const platform = detectPlatform(url)

    // 1. Pull metadata + the actual file. We keep --write-info-json so we
    //    have the full meta blob for downstream attribution.
    //    --write-comments asks yt-dlp to scrape top comments where it can.
    //    --max-filesize 256M is a sanity guard against accidental long-form.
    const ytArgs = [
      url,
      '-o', '%(id)s.%(ext)s',
      '--no-playlist',
      '--write-info-json',
      '--write-comments',
      '--write-thumbnail',
      '--convert-thumbnails', 'jpg',
      '--max-filesize', '256M',
      '--no-progress',
      '--no-warnings',
      '-f', 'mp4/bestvideo+bestaudio/best',
    ]

    await execa('yt-dlp', ytArgs, {
      cwd: tmp,
      timeout: 5 * 60 * 1000,
    })

    // 2. yt-dlp leaves the video as <id>.mp4 and metadata as <id>.info.json.
    //    Find them by listing the dir.
    const { stdout: lsOut } = await execa('ls', ['-1'], { cwd: tmp })
    const files = lsOut.split('\n').filter(Boolean)
    const infoFile = files.find((f) => f.endsWith('.info.json'))
    const videoFile = files.find((f) => /\.(mp4|mov|webm|mkv)$/i.test(f))
    const thumbFile = files.find((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))

    if (!videoFile || !infoFile) {
      throw new Error('yt-dlp finished without producing expected files')
    }

    const infoRaw = await readFile(join(tmp, infoFile), 'utf-8')
    const meta = JSON.parse(infoRaw) as Record<string, unknown>

    // 3. Upload to Cloudinary (master + thumbnail).
    const id = String(meta.id ?? videoFile.replace(/\.[^.]+$/, ''))
    const publicId = `${id}-master`

    const masterUpload = await cloudinary.uploader.upload(join(tmp, videoFile), {
      resource_type: 'video',
      folder,
      public_id: publicId,
      overwrite: true,
    })

    let thumbnailUrl: string | null = null
    if (thumbFile) {
      const thumbUpload = await cloudinary.uploader.upload(join(tmp, thumbFile), {
        resource_type: 'image',
        folder: `${folder}/thumbs`,
        public_id: `${id}-thumb`,
        overwrite: true,
      })
      thumbnailUrl = thumbUpload.secure_url
    }

    // 4. Extract comments (yt-dlp embeds them inside info.json under .comments).
    const rawComments = Array.isArray(meta.comments) ? meta.comments : []
    const comments = (rawComments as Array<Record<string, unknown>>)
      .slice(0, 200)
      .map((c) => ({
        id: String(c.id ?? ''),
        author: typeof c.author === 'string' ? c.author : null,
        text: typeof c.text === 'string' ? c.text : '',
        like_count: typeof c.like_count === 'number' ? c.like_count : null,
        timestamp: typeof c.timestamp === 'number' ? c.timestamp : null,
      }))
      .filter((c) => c.text.length > 0)

    return {
      platform,
      platform_video_id: id,
      channel: typeof meta.uploader === 'string' ? meta.uploader : null,
      channel_id: typeof meta.channel_id === 'string' ? meta.channel_id : null,
      title: typeof meta.title === 'string' ? meta.title : null,
      description: typeof meta.description === 'string' ? meta.description : null,
      duration_seconds:
        typeof meta.duration === 'number' ? Math.round(meta.duration) : null,
      view_count: typeof meta.view_count === 'number' ? meta.view_count : null,
      like_count: typeof meta.like_count === 'number' ? meta.like_count : null,
      comment_count:
        typeof meta.comment_count === 'number' ? meta.comment_count : null,
      thumbnail: typeof meta.thumbnail === 'string' ? meta.thumbnail : null,
      master_url: masterUpload.secure_url,
      thumbnail_url: thumbnailUrl ?? (typeof meta.thumbnail === 'string' ? meta.thumbnail : ''),
      comments,
      raw_meta: meta,
    }
  } finally {
    // Always clean the temp dir, even if yt-dlp errored.
    await rm(tmp, { recursive: true, force: true }).catch(() => {})
  }
}
