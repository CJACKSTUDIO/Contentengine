'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Wand2, X, Loader2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { img } from '@/lib/cloudinary'
import { toast } from 'sonner'
import type { StyleProfileRow } from '@/lib/types'

interface DraftProfile {
  name: string
  hint: string
  prompt_fragment: string
  accent_color: string
  thumbnail_url: string
}

const EMPTY_DRAFT: DraftProfile = {
  name: '',
  hint: '',
  prompt_fragment: '',
  accent_color: '#7F77DD',
  thumbnail_url: '',
}

export default function StyleTab() {
  const [profiles, setProfiles] = useState<StyleProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<StyleProfileRow | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vault/styles', { cache: 'no-store' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Failed to load styles')
      setProfiles(json.profiles as StyleProfileRow[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load styles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleSave = async (draft: DraftProfile, id?: string) => {
    const payload = {
      name: draft.name.trim(),
      hint: draft.hint.trim() || null,
      prompt_fragment: draft.prompt_fragment.trim(),
      accent_color: draft.accent_color || null,
      thumbnail_url: draft.thumbnail_url.trim() || null,
    }
    if (!payload.name || !payload.prompt_fragment) {
      toast.error('Name and prompt fragment are required')
      return
    }
    const res = await fetch(id ? `/api/vault/styles/${id}` : '/api/vault/styles', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? 'Save failed')
      return
    }
    toast.success(id ? 'Profile updated' : 'Profile created')
    setEditing(null)
    setCreating(false)
    void load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this style profile? Drafts already using it stay intact.')) return
    const res = await fetch(`/api/vault/styles/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? 'Delete failed')
      return
    }
    toast.success('Profile deleted')
    setEditing(null)
    void load()
  }

  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="subtitle">{profiles.length} profiles</span>
          <h2 className="h-section mt-1">Composable brand DNA</h2>
          <p className="mt-1 max-w-[640px] text-[13.5px] text-text-secondary">
            Each style profile bundles a prompt fragment + reference assets + tone notes. Mix and match
            them when generating — the studio composes prompts automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-4 text-[13px] font-semibold text-text-primary transition-colors hover:border-gold/40 hover:bg-white/[0.06]"
        >
          <Plus size={14} className="text-gold-bright" />
          New profile
        </button>
      </div>

      {loading && profiles.length === 0 ? (
        <p className="text-center text-[12.5px] text-text-muted">Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <p className="text-center text-[12.5px] text-text-muted">
          No style profiles yet. Click <span className="text-text-primary">New profile</span> to seed one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {profiles.map((profile, i) => (
            <motion.article
              key={profile.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className="card group overflow-hidden"
            >
              <div className="grid grid-cols-[160px_1fr]">
                <div
                  className="relative aspect-square overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${profile.accent_color ?? '#7F77DD'}33 0%, rgba(7,7,12,0.4) 100%)`,
                  }}
                >
                  {profile.thumbnail_url && (
                    <Image
                      src={profile.thumbnail_url.startsWith('http') ? profile.thumbnail_url : img(profile.thumbnail_url, { w: 320 })}
                      alt=""
                      fill
                      unoptimized
                      sizes="160px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ boxShadow: `inset 0 0 0 2px ${profile.accent_color ?? '#7F77DD'}66` }}
                  />
                </div>

                <div className="flex flex-col p-5">
                  <h3
                    className="text-[18px] leading-tight text-text-primary"
                    style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
                  >
                    {profile.name}
                  </h3>
                  {profile.hint && (
                    <p className="mt-1 text-[13px] text-text-secondary">{profile.hint}</p>
                  )}

                  <div className="mt-4 rounded-lg border border-border-subtle bg-void/30 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Wand2 size={11} className="text-gold-bright" />
                      <span className="subtitle text-[10px]">Prompt fragment</span>
                    </div>
                    <p
                      className="line-clamp-3 text-[12px] leading-snug text-text-secondary"
                      style={{ fontFamily: 'var(--font-mono), monospace' }}
                    >
                      {profile.prompt_fragment}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 text-[11.5px] text-text-muted">
                    <span>
                      <span
                        className="text-text-primary"
                        style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}
                      >
                        {profile.ref_asset_ids?.length ?? 0}
                      </span>{' '}
                      refs ·{' '}
                      <span
                        className="text-text-primary"
                        style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}
                      >
                        {profile.usage_count}
                      </span>{' '}
                      uses
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditing(profile)}
                      className="font-semibold text-gold-bright hover:underline"
                    >
                      Edit →
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <ProfileEditor
            initial={
              editing
                ? {
                    name: editing.name,
                    hint: editing.hint ?? '',
                    prompt_fragment: editing.prompt_fragment,
                    accent_color: editing.accent_color ?? '#7F77DD',
                    thumbnail_url: editing.thumbnail_url ?? '',
                  }
                : EMPTY_DRAFT
            }
            editingId={editing?.id ?? null}
            onClose={() => { setEditing(null); setCreating(false) }}
            onSave={handleSave}
            onDelete={editing ? () => handleDelete(editing.id) : undefined}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

function ProfileEditor({
  initial,
  editingId,
  onClose,
  onSave,
  onDelete,
}: {
  initial: DraftProfile
  editingId: string | null
  onClose: () => void
  onSave: (draft: DraftProfile, id?: string) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const [draft, setDraft] = useState<DraftProfile>(initial)
  const [saving, setSaving] = useState(false)

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
        aria-label="Close"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 38 }}
        className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[480px] flex-col border-l border-border-subtle bg-deep"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2
            className="text-[18px] text-text-primary"
            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
          >
            {editingId ? 'Edit profile' : 'New profile'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border-subtle bg-white/[0.03] text-text-secondary hover:bg-white/[0.06]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <Field label="Name">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-lg border border-border-subtle bg-void/30 px-3 py-2 text-[13px] text-text-primary outline-none focus:border-gold/50"
              placeholder="Magic World energy"
            />
          </Field>
          <Field label="Hint (one-liner)">
            <input
              type="text"
              value={draft.hint}
              onChange={(e) => setDraft({ ...draft, hint: e.target.value })}
              className="w-full rounded-lg border border-border-subtle bg-void/30 px-3 py-2 text-[13px] text-text-primary outline-none focus:border-gold/50"
              placeholder="Sparkle particles, deep purples, gold rim light"
            />
          </Field>
          <Field label="Prompt fragment">
            <textarea
              value={draft.prompt_fragment}
              onChange={(e) => setDraft({ ...draft, prompt_fragment: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-border-subtle bg-void/30 px-3 py-2 font-mono text-[12px] text-text-primary outline-none focus:border-gold/50"
              placeholder="Cinematic magical-world aesthetic. Deep purples, sparkle dust, gold rim light…"
              style={{ fontFamily: 'var(--font-mono), monospace' }}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Accent color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draft.accent_color}
                  onChange={(e) => setDraft({ ...draft, accent_color: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-md border border-border-subtle bg-transparent"
                />
                <input
                  type="text"
                  value={draft.accent_color}
                  onChange={(e) => setDraft({ ...draft, accent_color: e.target.value })}
                  className="flex-1 rounded-lg border border-border-subtle bg-void/30 px-3 py-2 text-[12px] text-text-primary outline-none focus:border-gold/50"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                />
              </div>
            </Field>
            <Field label="Thumbnail (URL or public_id)">
              <input
                type="text"
                value={draft.thumbnail_url}
                onChange={(e) => setDraft({ ...draft, thumbnail_url: e.target.value })}
                className="w-full rounded-lg border border-border-subtle bg-void/30 px-3 py-2 text-[12px] text-text-primary outline-none focus:border-gold/50"
                placeholder="catjack/…"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border-subtle bg-deep p-4">
          {onDelete && (
            <button
              type="button"
              onClick={async () => { setSaving(true); await onDelete(); setSaving(false) }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red/30 bg-red/5 px-4 text-[13px] font-semibold text-red hover:bg-red/10"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-xl border border-border-subtle bg-white/[0.03] px-4 text-[13px] font-semibold text-text-secondary hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => { setSaving(true); await onSave(draft, editingId ?? undefined); setSaving(false) }}
            className="btn-gold inline-flex h-10 items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {editingId ? 'Save changes' : 'Create profile'}
          </button>
        </div>
      </motion.aside>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="subtitle">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
