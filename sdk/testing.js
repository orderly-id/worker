export function createTestContext({ records = {}, config = {}, secrets = {}, network } = {}) {
  const buckets = new Map(Object.entries(records).map(([key, value]) => [key, structuredClone(value)]))
  const replies = []
  const requests = []
  return {
    replies,
    requests,
    ctx: {
      chat: { reply: async message => { replies.push(message); return message } },
      storage: {
        list: async model => structuredClone(buckets.get(model) || []),
        create: async (model, record) => { const next = { ...record }; buckets.set(model, [...(buckets.get(model) || []), next]); return structuredClone(next) },
        update: async (model, id, changes) => { const list = buckets.get(model) || []; const index = list.findIndex(item => item.id === id); if (index < 0) return null; list[index] = { ...list[index], ...changes }; return structuredClone(list[index]) },
      },
      config: { get: key => config[key] },
      secrets: { get: async key => secrets[key] },
      network: { fetch: async (url, options) => { requests.push({ url, options }); return network ? network(url, options) : { ok: true, status: 200 } } },
    },
    records: model => structuredClone(buckets.get(model) || []),
  }
}

export async function dispatchMessage(worker, message, ctx) {
  if (!worker.onMessage) throw new Error('Worker does not implement onMessage')
  return worker.onMessage({ text: message }, ctx)
}

export async function dispatchAction(worker, name, input, ctx) {
  const handler = worker.actions?.[name]
  if (!handler) throw new Error(`Unknown action: ${name}`)
  return handler(input, ctx)
}
