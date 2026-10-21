import 'dotenv/config'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { onRequestError } from '@/instrumentation'

describe('GET /api/health (frequent uptime check)', () => {
  afterEach(() => {
    vi.doUnmock('payload')
    vi.resetModules()
  })

  // Polled every few minutes. It must never touch the database: on Neon's free plan a
  // frequent database ping keeps it awake all month and uses up the compute allowance.
  it('reports the site is up without touching the database', async () => {
    vi.resetModules()
    const getPayload = vi.fn(async () => {
      throw new Error('the uptime check must not connect to the database')
    })
    vi.doMock('payload', async (orig) => ({
      ...(await orig<typeof import('payload')>()),
      getPayload,
    }))
    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ status: 'ok' })
    expect(getPayload).not.toHaveBeenCalled()
  })
})

describe('GET /api/health/database (infrequent database check)', () => {
  afterEach(() => {
    vi.doUnmock('payload')
    vi.resetModules()
  })

  it('reports ok when the database answers, and is never cached', async () => {
    const { GET } = await import('@/app/api/health/database/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ status: 'ok', database: 'ok' })
  })

  it('returns 503 when the database is down, without leaking the error', async () => {
    vi.resetModules()
    vi.doMock('payload', async (orig) => ({
      ...(await orig<typeof import('payload')>()),
      getPayload: async () => {
        throw new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2')
      },
    }))
    const { GET } = await import('@/app/api/health/database/route')
    const res = await GET()
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).toBe('{"status":"error","database":"unreachable"}')
  })
})

describe('onRequestError', () => {
  afterEach(() => vi.restoreAllMocks())

  // One JSON line per server error, so Vercel's log search can filter and alert on it.
  it('logs one structured line without request data', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = Object.assign(new Error('boom'), { digest: 'abc123' })
    await onRequestError(
      err,
      {
        path: '/beauty/x?email=someone@example.com',
        method: 'GET',
        headers: { cookie: 'mo_voter=secret' },
      },
      {
        routerKind: 'App Router',
        routePath: '/[category]/[slug]',
        routeType: 'render',
        renderSource: 'react-server-components',
        revalidateReason: undefined,
      },
    )
    expect(log).toHaveBeenCalledTimes(1)
    const line = log.mock.calls[0][0] as string
    expect(JSON.parse(line)).toMatchObject({
      level: 'error',
      event: 'request_error',
      route: '/[category]/[slug]',
      method: 'GET',
      digest: 'abc123',
      message: 'boom',
    })
    expect(line).not.toContain('someone@example.com')
    expect(line).not.toContain('mo_voter')
  })
})
