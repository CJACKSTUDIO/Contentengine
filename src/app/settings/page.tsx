'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, Plug, Calendar, Users, Bell, Webhook, type LucideIcon, ChevronRight } from 'lucide-react'
import { connections, scheduleConfig, teamMembers } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

const STATUS_VISUAL: Record<string, { Icon: LucideIcon; color: string; label: string; pill: string }> = {
  connected:    { Icon: CheckCircle2, color: 'var(--accent-green)', label: 'Connected',    pill: 'pill-green' },
  warning:      { Icon: AlertTriangle, color: 'var(--accent-amber)', label: 'Action needed', pill: 'pill-amber' },
  disconnected: { Icon: XCircle,       color: 'var(--text-muted)',    label: 'Not linked',    pill: 'pill-muted' },
}

const CATEGORY_LABEL: Record<string, string> = {
  social:  'Social channels',
  ai:      'AI providers',
  storage: 'Storage',
  data:    'Data + secrets',
}

export default function SettingsPage() {
  const grouped = connections.reduce<Record<string, typeof connections>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <span className="subtitle">Plumbing</span>
        <h1
          className="mt-1 text-[40px] leading-[1.05] tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
        >
          Settings
        </h1>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
          Connections, schedule, team, alerts, webhooks. Every secret comes from 1Password —
          values never appear in this UI.
        </p>
      </motion.section>

      {/* Connections */}
      <section className="mb-12">
        <div className="mb-5 flex items-center gap-2">
          <Plug size={16} className="text-gold-bright" />
          <h2 className="h-section">Connections</h2>
        </div>

        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="subtitle mb-2">{CATEGORY_LABEL[cat]}</div>
              <div className="card-elev divide-y divide-border-subtle">
                {items.map((conn) => {
                  const v = STATUS_VISUAL[conn.status]
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: v.color }}>
                          <v.Icon size={16} />
                        </span>
                        <div>
                          <div
                            className="text-[14px] text-text-primary"
                            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                          >
                            {conn.name}
                          </div>
                          <div className="text-[12px] text-text-muted">{conn.detail}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className="hidden text-[10.5px] text-text-muted sm:inline"
                          style={{ fontFamily: 'var(--font-mono), monospace' }}
                        >
                          {conn.lastChecked}
                        </span>
                        <span className={cn('pill', v.pill)}>{v.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section className="mb-12">
        <div className="mb-5 flex items-center gap-2">
          <Calendar size={16} className="text-gold-bright" />
          <h2 className="h-section">Schedule</h2>
        </div>

        <div className="card-elev p-5">
          <div className="mb-4 grid grid-cols-2 gap-4 border-b border-border-subtle pb-4 sm:grid-cols-4">
            <Stat label="Sunday batch" value="02:00 UTC" />
            <Stat label="Posts per day" value="4" />
            <Stat label="Total per week" value="28" />
            <Stat label="Critic threshold" value="80 / 100" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
            {scheduleConfig.map((day) => (
              <div
                key={day.day}
                className="rounded-xl border border-border-subtle bg-white/[0.02] p-3"
              >
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                  {day.day}
                </div>
                <div
                  className="mt-1 text-[16px] text-text-primary"
                  style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
                >
                  {day.postsPerDay} posts
                </div>
                <ul
                  className="mt-2 space-y-0.5 text-[10.5px] text-text-secondary"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {day.preferredTimes.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mb-12">
        <div className="mb-5 flex items-center gap-2">
          <Users size={16} className="text-gold-bright" />
          <h2 className="h-section">Team</h2>
        </div>

        <div className="card-elev divide-y divide-border-subtle">
          {teamMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div
                className="grid h-10 w-10 place-items-center rounded-full text-[14px] font-bold text-void"
                style={{
                  background: `linear-gradient(135deg, ${m.color} 0%, var(--accent-gold-bright) 100%)`,
                }}
              >
                {m.initial}
              </div>
              <div className="flex-1">
                <div
                  className="text-[14px] text-text-primary"
                  style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                >
                  {m.name}
                </div>
                <div className="text-[12px] text-text-muted">{m.email}</div>
              </div>
              <span className="pill pill-gold">{m.role}</span>
            </div>
          ))}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 px-5 py-4 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-white/[0.03] hover:text-text-primary"
          >
            + Invite collaborator
          </button>
        </div>
      </section>

      {/* Alerts + Webhooks side by side */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-5 flex items-center gap-2">
            <Bell size={16} className="text-gold-bright" />
            <h2 className="h-section">Alerts</h2>
          </div>
          <div className="card-elev p-5">
            <AlertRow label="Monthly cost above $120" enabled />
            <AlertRow label="Sunday batch fails" enabled />
            <AlertRow label="Any agent retries 3+ times" enabled />
            <AlertRow label="Critic auto-rejects ≥30%" />
            <AlertRow label="OAuth token expiring < 7 days" enabled />
          </div>
        </div>
        <div>
          <div className="mb-5 flex items-center gap-2">
            <Webhook size={16} className="text-gold-bright" />
            <h2 className="h-section">Webhooks</h2>
          </div>
          <div className="card-elev divide-y divide-border-subtle">
            <WebhookRow event="video.published"      url="catjack.app/api/webhooks/posted" />
            <WebhookRow event="batch.completed"      url="catjack.app/api/webhooks/batch" />
            <WebhookRow event="ultra_rare.earned →"  url="studio.catjack.app/triggers/celebrate" />
          </div>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-text-muted">{label}</div>
      <div
        className="mt-0.5 text-[18px] text-text-primary"
        style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
      >
        {value}
      </div>
    </div>
  )
}

function AlertRow({ label, enabled = false }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-3 last:border-b-0">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <div
        className={cn(
          'flex h-5 w-9 items-center rounded-full p-0.5 transition-colors',
          enabled ? 'bg-gold' : 'bg-white/[0.08]',
        )}
      >
        <div
          className={cn(
            'h-4 w-4 rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </div>
    </div>
  )
}

function WebhookRow({ event, url }: { event: string; url: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div>
        <div
          className="text-[13.5px] text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
        >
          {event}
        </div>
        <div
          className="mt-0.5 text-[11.5px] text-text-muted"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          {url}
        </div>
      </div>
      <ChevronRight size={14} className="text-text-muted" />
    </div>
  )
}
