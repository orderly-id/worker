import { defineWorker, WorkerError } from '../../../../sdk/index.js'

function noteInput(input = {}) {
  const content = String(input.content || '').trim()
  if (!content) throw new WorkerError('INVALID_NOTE', 'Isi catatan wajib diisi')
  return { id: crypto.randomUUID(), title: String(input.title || content.slice(0, 48)), content, folder: String(input.folder || 'Default Folder'), created_at: new Date().toISOString() }
}

export default defineWorker({
  async onMessage(event, ctx) {
    const content = event.text.replace(/^catat(?:kan)?\s*/i, '').trim()
    const note = noteInput({ content })
    await ctx.storage.create('notes', note)
    await ctx.chat.reply(`Tersimpan di ${note.folder}: ${note.title}`)
    return note
  },
  actions: {
    list: async (_, ctx) => ctx.storage.list('notes'),
    create: async (input, ctx) => ctx.storage.create('notes', noteInput(input)),
  },
})
