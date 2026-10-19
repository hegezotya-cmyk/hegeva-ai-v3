export type CoreRequestResult<T> = { value: T; accepted: boolean; generation: number }

type Entry<T> = { generation: number; inflight: Promise<CoreRequestResult<T>> | null; cached: { value: T; expiresAt: number } | null }

export function createCoreRequestCoordinator<T>(ttlMs = 15_000) {
  const entries = new Map<string, Entry<T>>()
  const entryFor = (identity: string) => {
    let entry = entries.get(identity)
    if (!entry) { entry = { generation: 0, inflight: null, cached: null }; entries.set(identity, entry) }
    return entry
  }
  return {
    request(identity: string, fetcher: () => Promise<T>, invalidate = false): Promise<CoreRequestResult<T>> {
      const entry = entryFor(identity)
      const now = Date.now()
      if (!invalidate && entry.cached && entry.cached.expiresAt > now) return Promise.resolve({ value: entry.cached.value, accepted: true, generation: entry.generation })
      if (!invalidate && entry.inflight) return entry.inflight
      const generation = entry.generation + 1
      entry.generation = generation
      if (invalidate) entry.cached = null
      const request = fetcher().then((value) => {
        const accepted = entry.generation === generation
        if (accepted) entry.cached = { value, expiresAt: Date.now() + ttlMs }
        return { value, accepted, generation }
      })
      entry.inflight = request
      void request.finally(() => { if (entry.inflight === request) entry.inflight = null })
      return request
    },
    invalidate(identity: string) { const entry = entryFor(identity); entry.cached = null },
  }
}
