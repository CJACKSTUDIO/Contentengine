/**
 * Catjack Studio · Postiz API client.
 *
 * Wraps the public Postiz REST API. Auth is a static bearer token from
 * 1Password (POSTIZ_API_KEY). All operations return typed responses; we
 * surface errors as thrown PostizError so callers can branch on .status.
 *
 * Endpoint reference (extracted from Postiz CLI v2.0.13):
 *   GET    /public/v1/integrations
 *   GET    /public/v1/integration-settings/:id
 *   POST   /public/v1/upload                          (multipart)
 *   GET    /public/v1/posts?startDate=&endDate=&customer=
 *   GET    /public/v1/posts/:id
 *   POST   /public/v1/posts
 *   PUT    /public/v1/posts/:id
 *   DELETE /public/v1/posts/:id
 *   GET    /public/v1/posts/:id/status
 *   GET    /public/v1/analytics/:integrationId?date=YYYY-MM-DD
 *   GET    /public/v1/analytics/post/:postId?date=YYYY-MM-DD
 */

import { env } from './op'

const BASE_URL = process.env.POSTIZ_API_URL || 'https://api.postiz.com'

export class PostizError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'PostizError'
    this.status = status
    this.body = body
  }
}

export type PostizPlatform =
  | 'tiktok'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'threads'
  | 'pinterest'
  | 'reddit'
  | 'bluesky'
  | string

export interface PostizIntegration {
  id: string
  name: string
  identifier: PostizPlatform
  picture: string | null
  disabled: boolean
  profile: string | null
}

export interface PostizUploadResult {
  id: string
  path: string
  /** Direct CDN URL for the uploaded asset. */
  url?: string
}

/** Per-platform post variant. Each integration in the post array gets one. */
export interface PostizPostValue {
  /** Caption / body text. */
  content: string
  /** Optional uploaded media references (returned by upload()). */
  image?: { id: string; path: string }[]
}

export interface PostizCreatePostInput {
  /** 'schedule' to publish at `date`, 'draft' to leave in calendar untouched. */
  type: 'schedule' | 'draft'
  /** ISO 8601 timestamp. Required even for drafts (placeholder ok). */
  date: string
  /** Auto-shorten URLs in caption. Default true. */
  shortLink?: boolean
  /** Tag labels for filtering in Postiz UI. */
  tags?: string[]
  /** One per platform — same media, tailored caption. */
  posts: {
    integration: { id: string }
    value: PostizPostValue[]
    /** Platform-specific knobs (privacy, comments, etc). Empty by default. */
    settings?: Record<string, unknown>
  }[]
}

export interface PostizPost {
  id: string
  state: string
  publishDate: string | null
  releaseId?: string
  // Postiz returns a richer shape; we accept the full object as unknown
  // and let consumers cast where they need it.
  [key: string]: unknown
}

export interface PostizAnalytics {
  integrationId: string
  date: string
  /** Daily metrics object. Schema depends on platform. */
  data: unknown
}

class PostizClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = env.postiz()
    this.baseUrl = BASE_URL
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    /** When true, omit JSON content-type so multipart can set its own. */
    multipart = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      // Postiz public API expects the raw key in Authorization, no Bearer prefix.
      Authorization: this.apiKey,
      ...((init.headers as Record<string, string>) ?? {}),
    }
    if (!multipart && !headers['Content-Type'] && init.body) {
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers })

    let body: unknown = null
    const text = await res.text()
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        body = text
      }
    }

    if (!res.ok) {
      const msg = (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Postiz request failed: ${res.status}`)
      throw new PostizError(msg, res.status, body)
    }

    return body as T
  }

  /** Connected social channels. */
  listIntegrations(): Promise<PostizIntegration[]> {
    return this.request<PostizIntegration[]>('/public/v1/integrations')
  }

  /** Upload a media file (image/video). Returns the asset reference for use in posts. */
  async upload(file: Blob, filename: string): Promise<PostizUploadResult> {
    const form = new FormData()
    form.append('file', file, filename)
    return this.request<PostizUploadResult>('/public/v1/upload', {
      method: 'POST',
      body: form,
    }, true)
  }

  /** Schedule (or draft) a post across one or more integrations. */
  createPost(input: PostizCreatePostInput): Promise<PostizPost> {
    return this.request<PostizPost>('/public/v1/posts', {
      method: 'POST',
      body: JSON.stringify({
        shortLink: true,
        tags: [],
        ...input,
      }),
    })
  }

  /** Update an existing post. */
  updatePost(id: string, input: Partial<PostizCreatePostInput>): Promise<PostizPost> {
    return this.request<PostizPost>(`/public/v1/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }

  /** Cancel/delete a scheduled post. */
  deletePost(id: string): Promise<{ ok: true }> {
    return this.request<{ ok: true }>(`/public/v1/posts/${id}`, {
      method: 'DELETE',
    })
  }

  /** Latest known status from Postiz (queued/published/failed/etc). */
  getPostStatus(id: string): Promise<{ status: string; releaseId?: string }> {
    return this.request<{ status: string; releaseId?: string }>(
      `/public/v1/posts/${id}/status`,
    )
  }

  /** List posts in a date window (defaults: 30 days back, 30 days forward). */
  listPosts(filters: {
    startDate?: string
    endDate?: string
    customer?: string
  } = {}): Promise<PostizPost[]> {
    const start =
      filters.startDate ?? new Date(Date.now() - 30 * 86400_000).toISOString()
    const end =
      filters.endDate ?? new Date(Date.now() + 30 * 86400_000).toISOString()
    const qs = new URLSearchParams({ startDate: start, endDate: end })
    if (filters.customer) qs.set('customer', filters.customer)
    return this.request<PostizPost[]>(`/public/v1/posts?${qs.toString()}`)
  }

  /** Daily analytics for a connected channel. `date` defaults to today (UTC). */
  getIntegrationAnalytics(
    integrationId: string,
    date?: string,
  ): Promise<PostizAnalytics> {
    const d = date ?? new Date().toISOString().slice(0, 10)
    return this.request<PostizAnalytics>(
      `/public/v1/analytics/${integrationId}?date=${encodeURIComponent(d)}`,
    )
  }

  /** Daily analytics for a specific scheduled post. */
  getPostAnalytics(postId: string, date?: string): Promise<PostizAnalytics> {
    const d = date ?? new Date().toISOString().slice(0, 10)
    return this.request<PostizAnalytics>(
      `/public/v1/analytics/post/${postId}?date=${encodeURIComponent(d)}`,
    )
  }
}

let _client: PostizClient | null = null

/** Singleton accessor. Lazily constructed so import-time secret resolution
 *  doesn't blow up the build phase. */
export function postiz(): PostizClient {
  if (!_client) _client = new PostizClient()
  return _client
}
