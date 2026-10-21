import type { Instrumentation } from 'next'

/**
 * Next calls this for every server error (rendering, route handlers, server actions).
 * It writes one JSON line to the server log, which Vercel keeps and can search or alert on.
 * Only the route pattern, method and error are logged: never the URL (query strings can
 * hold emails), headers or cookies. Swap in Sentry here if the client wants email alerts.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err as Error & { digest?: string }
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'request_error',
      route: context.routePath,
      routeType: context.routeType,
      method: request.method,
      digest: error.digest,
      message: error.message,
      at: new Date().toISOString(),
    }),
  )
}
