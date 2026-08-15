import { defineWorker, WorkerError } from '../../../../sdk/index.js'

export default defineWorker({
  async onMessage(event, ctx) {
    const title = event.text.replace(/^tugas\s*/i, '').trim()
    if (!title) throw new WorkerError('INVALID_TASK', 'Judul tugas wajib diisi')
    const task = { id: crypto.randomUUID(), title, status: 'open', created_at: new Date().toISOString() }
    await ctx.storage.create('tasks', task); await ctx.chat.reply(`Tugas dibuat: ${title}`); return task
  },
  actions: {
    list: async (_, ctx) => ctx.storage.list('tasks'),
    complete: async ({ id }, ctx) => { const task = await ctx.storage.update('tasks', id, { status: 'done' }); if (!task) throw new WorkerError('TASK_NOT_FOUND', 'Tugas tidak ditemukan'); return task },
  },
})
