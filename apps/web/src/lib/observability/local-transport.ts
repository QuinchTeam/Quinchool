// Development runs Sentry's instrumentation and relay hooks without sending data to Sentry.
export const localTransport = () => ({
  send: () => Promise.resolve({ statusCode: 200 }),
  flush: () => Promise.resolve(true),
});
