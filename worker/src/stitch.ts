import { execa } from 'execa'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export interface StitchShot {
  /** Cloudinary URL of the produced asset. */
  url: string
  kind: 'image' | 'video'
  /** Per-shot duration in seconds. Defaults to 3 for images, 5 for videos. */
  duration_seconds?: number
}

export interface StitchArgs {
  draft_id: string
  shots: StitchShot[]
  /** Output resolution. Defaults to 1080×1920 (9:16). */
  width?: number
  height?: number
}

export interface StitchResult {
  master_url: string
  thumbnail_url: string
  duration_seconds: number
  /** Cloudinary public_id of the master, useful for Postiz upload step. */
  master_public_id: string
}

/**
 * Concat a sequence of generated shots into a single MP4. Images get
 * looped to a fixed duration; videos pass through after a normalize
 * step (resolution + audio track) so concat doesn't trip on codec
 * mismatches.
 */
export async function stitch(args: StitchArgs): Promise<StitchResult> {
  if (args.shots.length === 0) {
    throw new Error('stitch: no shots provided')
  }
  const tmp = await mkdtemp(join(tmpdir(), 'catjack-stitch-'))
  const W = args.width ?? 1080
  const H = args.height ?? 1920

  try {
    // 1. Normalise each shot into a uniform mp4 segment.
    const segmentPaths: string[] = []
    let totalSeconds = 0
    for (let i = 0; i < args.shots.length; i++) {
      const shot = args.shots[i]
      const duration = shot.duration_seconds ?? (shot.kind === 'image' ? 3 : 5)
      totalSeconds += duration

      const segPath = join(tmp, `seg-${String(i).padStart(2, '0')}.mp4`)
      const inPath = join(tmp, `in-${i}-${shot.kind === 'image' ? 'img' : 'vid'}`)

      // Download source.
      const inRes = await fetch(shot.url)
      if (!inRes.ok) throw new Error(`fetch ${shot.url}: ${inRes.status}`)
      const inBuf = Buffer.from(await inRes.arrayBuffer())
      await writeFile(inPath, inBuf)

      if (shot.kind === 'image') {
        // image → 3s mp4 with silent audio.
        await execa('ffmpeg', [
          '-y',
          '-loop', '1',
          '-i', inPath,
          '-f', 'lavfi',
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-c:v', 'libx264',
          '-tune', 'stillimage',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-pix_fmt', 'yuv420p',
          '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`,
          '-t', String(duration),
          '-shortest',
          segPath,
        ])
      } else {
        // video → re-encode to canonical resolution + audio so concat
        // doesn't fail on mismatched codecs.
        await execa('ffmpeg', [
          '-y',
          '-i', inPath,
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-pix_fmt', 'yuv420p',
          '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30`,
          '-t', String(duration),
          segPath,
        ])
      }
      segmentPaths.push(segPath)
    }

    // 2. concat list file.
    const listPath = join(tmp, 'concat.txt')
    await writeFile(
      listPath,
      segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'),
    )

    // 3. concat into final master.
    const masterPath = join(tmp, 'master.mp4')
    await execa('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c', 'copy',
      masterPath,
    ])

    // 4. upload master + first frame thumbnail.
    const masterUpload = await cloudinary.uploader.upload(masterPath, {
      resource_type: 'video',
      folder: `catjack/studio/drafts/${args.draft_id}`,
      public_id: 'master',
      overwrite: true,
    })

    // Generate a thumbnail by uploading a single-frame extract.
    const thumbPath = join(tmp, 'thumb.jpg')
    await execa('ffmpeg', [
      '-y',
      '-i', masterPath,
      '-vf', 'thumbnail',
      '-frames:v', '1',
      thumbPath,
    ])
    const thumbUpload = await cloudinary.uploader.upload(thumbPath, {
      resource_type: 'image',
      folder: `catjack/studio/drafts/${args.draft_id}`,
      public_id: 'master-thumb',
      overwrite: true,
    })

    return {
      master_url: masterUpload.secure_url,
      master_public_id: masterUpload.public_id,
      thumbnail_url: thumbUpload.secure_url,
      duration_seconds: totalSeconds,
    }
  } finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => {})
  }
}
