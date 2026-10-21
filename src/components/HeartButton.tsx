'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

/**
 * Heart a post. Pages are static, so the count is fetched on load. A post can show more than
 * one button (header and end of article); they share this store so they never disagree.
 * Whether this reader has hearted comes from the server (an anonymous voter cookie), so it
 * survives cleared storage and can't be faked to remove someone else's heart.
 */

type State = { hearts: number | null; hearted: boolean; pending: boolean }

const states = new Map<number, State>()
const listeners = new Map<number, Set<() => void>>()
const loading = new Set<number>()
const EMPTY: State = { hearts: null, hearted: false, pending: false }

const set = (postId: number, patch: Partial<State>) => {
  states.set(postId, { ...(states.get(postId) ?? EMPTY), ...patch })
  listeners.get(postId)?.forEach((notify) => notify())
}

const subscribe = (postId: number) => (notify: () => void) => {
  const subs = listeners.get(postId) ?? new Set()
  subs.add(notify)
  listeners.set(postId, subs)
  return () => subs.delete(notify)
}

const load = async (postId: number) => {
  if (loading.has(postId) || states.get(postId)?.hearts != null) return
  loading.add(postId)
  try {
    const res = await fetch(`/api/posts/${postId}/heart`, { cache: 'no-store' })
    if (res.ok) set(postId, (await res.json()) as { hearts: number; hearted: boolean })
  } finally {
    loading.delete(postId)
  }
}

const toggle = async (postId: number) => {
  const current = states.get(postId) ?? EMPTY
  if (current.pending || current.hearts == null) return
  const next = !current.hearted
  // Optimistic: the reader sees it change at once; roll back if the request fails.
  set(postId, { hearted: next, hearts: current.hearts + (next ? 1 : -1), pending: true })
  try {
    const res = await fetch(`/api/posts/${postId}/heart`, { method: next ? 'POST' : 'DELETE' })
    // 429 (rate limit) and other errors roll back below.
    if (!res.ok) throw new Error(String(res.status))
    const { hearts, hearted } = (await res.json()) as { hearts: number; hearted: boolean }
    set(postId, { hearts, hearted, pending: false })
  } catch {
    set(postId, { hearted: current.hearted, hearts: current.hearts, pending: false })
  }
}

export function HeartButton({
  postId,
  variant = 'inline',
}: {
  postId: number
  variant?: 'inline' | 'prominent'
}) {
  const state = useSyncExternalStore(
    useCallback((notify: () => void) => subscribe(postId)(notify), [postId]),
    () => states.get(postId) ?? EMPTY,
    () => EMPTY,
  )

  useEffect(() => {
    void load(postId)
  }, [postId])

  const { hearts, hearted, pending } = state
  const count = hearts ?? 0

  return (
    <button
      type="button"
      onClick={() => void toggle(postId)}
      disabled={hearts == null}
      aria-pressed={hearted}
      aria-busy={pending}
      aria-label={`${hearted ? 'Remove your heart' : 'Heart this story'}, ${count} ${count === 1 ? 'heart' : 'hearts'}`}
      className={cn(
        'group inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full transition-colors disabled:opacity-60',
        variant === 'prominent' ? 'border-line hover:border-fg border px-5 py-2' : '-ml-2 px-2',
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={cn(
          'ease-out-soft size-5 transition-transform duration-200 group-active:scale-90',
          hearted ? 'fill-accent stroke-accent' : 'stroke-fg fill-none',
        )}
        strokeWidth={1.75}
      >
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
      </svg>
      <span aria-hidden="true" className="text-fg min-w-[2ch] text-sm font-semibold tabular-nums">
        {hearts == null ? ' ' : count}
      </span>
    </button>
  )
}
