import 'dotenv/config'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET as health } from '@/app/api/health/route'
import { onRequestError } from '@/instrumentation'

describe('GET /api/health', () => {
  // What an uptime monitor polls: proves the app *and* its database answer.
  it('reports ok when the database answers, and is never cached', async () => {
    const res = await health()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ status: 'ok', database: 'ok' })
  })
})

describe('GET /api/health when the database is down', () => {
  afterEach(() => {
    vi.doUnmock('payload')
    vi.resetModules()
  })

  it('returns 503 so the monitor alerts, without leaking the error', async () => {
    vi.resetModules()
    vi.doMock('payload', async (orig) => ({
      ...(await orig<typeof import('payload')>()),
      getPayload: async () => {
        throw new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2')
      },
    }))
    const { GET } = await import('@/app/api/health/route')
    const res = await GET()
    expect(res.status).toBe(503)
    const body = JSON.stringify(await res.json())
    expect(body).toBe('{"status":"error","database":"unreachable"}')
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
