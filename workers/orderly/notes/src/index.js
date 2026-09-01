import { defineWorker, WorkerError } from '../../../../sdk/index.js'

function humanName(value) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ')
  return normalized ? normalized[0].toLocaleUpperCase('id-ID') + normalized.slice(1) : ''
}

function searchable(value) {
  return String(value || '').toLocaleLowerCase('id-ID').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function noteInput(input = {}) {
  const content = String(input.content || '').trim()
  if (!content) throw new WorkerError('INVALID_NOTE', 'Isi catatan wajib diisi')
  return {
    id: crypto.randomUUID(),
    title: humanName(input.title || content.slice(0, 48)),
    content,
    folder_id: input.folder_id,
    folder: input.folder,
    created_at: new Date().toISOString(),
  }
}

async function availableFolders(ctx) {
  const folders = await ctx.storage.list('folders')
  if (folders.length) return folders
  const folder = { id: crypto.randomUUID(), name: 'Default Folder', position: 0, created_at: new Date().toISOString() }
  await ctx.storage.create('folders', folder)
  return [folder]
}

function selectFolder(folders, message, explicitName) {
  if (explicitName) {
    const exact = folders.find(folder => searchable(folder.name) === searchable(explicitName))
    if (!exact) throw new WorkerError('FOLDER_NOT_FOUND', `Folder ${explicitName} tidak ditemukan`)
    return exact
  }
  const text = ` ${searchable(message)} `
  return folders
    .filter(folder => searchable(folder.name) !== 'default folder')
    .sort((left, right) => searchable(right.name).length - searchable(left.name).length)
    .find(folder => text.includes(` ${searchable(folder.name)} `)) || folders.find(folder => folder.name === 'Default Folder') || folders[0]
}

function explicitFolder(message) {
  return message.match(/(?:ke|di|dalam)\s+folder\s+["']?([^"':,]+)["']?\s*[:,]/i)?.[1]?.trim()
}

function stateFolders(context) {
  return Array.isArray(context?.state?.folders) ? context.state.folders : []
}

function activeFolders(context) {
  return stateFolders(context).filter(folder => !folder.archived_at)
}

function stateNotes(context) {
  return Array.isArray(context?.state?.notes) ? context.state.notes : []
}

function requestedFolder(folders, action) {
  const id = String(action.folder_id || '').trim()
  const name = String(action.folder || '').trim()
  return folders.find(folder => id && folder.id === id)
    || folders.find(folder => name && searchable(folder.name) === searchable(name))
}

function inferredFolder(folders, action, defaultFolderId) {
  const selected = requestedFolder(folders, action)
  if (action.folder_id || action.folder) return selected
  const text = ` ${searchable(`${action.title || ''} ${action.content || ''}`)} `
  return folders
    .filter(folder => searchable(folder.name) !== 'default folder')
    .sort((left, right) => searchable(right.name).length - searchable(left.name).length)
    .find(folder => text.includes(` ${searchable(folder.name)} `))
    || folders.find(folder => folder.id === defaultFolderId)
    || folders[0]
}

function selectedNote(notes, action) {
  const id = String(action.note_id || '').trim()
  const title = searchable(action.title)
  return notes.find(note => id && note.id === id)
    || notes.find(note => title && searchable(note.title) === title)
}

function operation(id, capability, resource, input = {}, targetId) {
  return { id, capability, resource, input, ...(targetId ? { target_id: targetId } : {}) }
}

function envelope(action, reply, operations = [], output = {}) {
  return { version: '1', action, reply, operations, output }
}

export default defineWorker({
  async onAction(action, context) {
    const folders = stateFolders(context)
    const availableFolders = activeFolders(context)
    const notes = stateNotes(context)

    switch (action.action) {
      case 'create_note': {
        const content = String(action.content || '').trim()
        if (!content) throw new WorkerError('INVALID_NOTE', 'Isi catatan wajib diisi')
        const folder = inferredFolder(availableFolders, action, context?.state?.default_folder_id)
        if (!folder) throw new WorkerError('FOLDER_NOT_FOUND', 'Folder tujuan tidak ditemukan')
        const title = humanName(action.title || content.slice(0, 80))
        return envelope('create_note', `Catatan “${title}” berhasil disimpan di folder “${folder.name}”.`, [
          operation('note', 'storage.create', 'notes', { folder_id: folder.id, title, content }),
        ], { note_id: { $result: 'note.id' }, folder_id: folder.id })
      }

      case 'create_folder': {
        const name = humanName(action.folder)
        if (!name) throw new WorkerError('INVALID_FOLDER', 'Nama folder wajib diisi')
        return envelope('create_folder', `Folder “${name}” berhasil dibuat.`, [
          operation('folder', 'storage.create', 'folders', { name }),
        ], { folder_id: { $result: 'folder.id' } })
      }

      case 'rename_note': {
        const note = selectedNote(notes, action)
        const title = humanName(action.new_title)
        if (!note || !title) throw new WorkerError('NOTE_NOT_FOUND', 'Catatan yang akan diubah tidak ditemukan')
        return envelope('rename_note', `Judul catatan “${note.title}” berhasil diubah menjadi “${title}”.`, [
          operation('note', 'storage.update', 'notes', { title }, note.id),
        ], { note_id: note.id })
      }

      case 'delete_note': {
        const note = selectedNote(notes, action)
        if (!note) throw new WorkerError('NOTE_NOT_FOUND', 'Catatan yang akan dihapus tidak ditemukan')
        return envelope('delete_note', `Catatan “${note.title}” berhasil dihapus.`, [
          operation('note', 'storage.delete', 'notes', {}, note.id),
        ], { note_id: note.id })
      }

      case 'move_note': {
        const note = selectedNote(notes, action)
        const folder = requestedFolder(folders, action)
        if (!note || !folder) throw new WorkerError('TARGET_NOT_FOUND', 'Catatan atau folder tujuan tidak ditemukan')
        return envelope('move_note', `Catatan “${note.title}” berhasil dipindahkan ke folder “${folder.name}”.`, [
          operation('note', 'storage.update', 'notes', { folder_id: folder.id }, note.id),
        ], { note_id: note.id, folder_id: folder.id })
      }

      case 'rename_folder': {
        const folder = requestedFolder(folders, action)
        const name = humanName(action.new_folder)
        if (!folder || !name) throw new WorkerError('FOLDER_NOT_FOUND', 'Folder yang akan diubah tidak ditemukan')
        return envelope('rename_folder', `Folder “${folder.name}” berhasil diubah menjadi “${name}”.`, [
          operation('folder', 'storage.update', 'folders', { name }, folder.id),
        ], { folder_id: folder.id })
      }

      case 'mark_note_important':
      case 'unmark_note_important': {
        const note = selectedNote(notes, action)
        if (!note) throw new WorkerError('NOTE_NOT_FOUND', 'Catatan tidak ditemukan')
        const important = action.action === 'mark_note_important'
        return envelope(action.action, `Catatan “${note.title}” berhasil ${important ? 'ditandai sebagai Important' : 'dihapus dari Important'}.`, [
          operation('note', 'storage.update', 'notes', { important }, note.id),
        ], { note_id: note.id })
      }

      case 'archive_note':
      case 'restore_note': {
        const note = selectedNote(notes, action)
        if (!note) throw new WorkerError('NOTE_NOT_FOUND', 'Catatan tidak ditemukan')
        const archived = action.action === 'archive_note'
        return envelope(action.action, `Catatan “${note.title}” berhasil ${archived ? 'diarsipkan' : 'dipulihkan'}.`, [
          operation('note', 'storage.update', 'notes', { archived }, note.id),
        ], { note_id: note.id })
      }

      case 'mark_folder_important':
      case 'unmark_folder_important': {
        const folder = requestedFolder(folders, action)
        if (!folder) throw new WorkerError('FOLDER_NOT_FOUND', 'Folder tidak ditemukan')
        const important = action.action === 'mark_folder_important'
        return envelope(action.action, `Folder “${folder.name}” berhasil ${important ? 'ditandai sebagai Important' : 'dihapus dari Important'}.`, [
          operation('folder', 'storage.update', 'folders', { important }, folder.id),
        ], { folder_id: folder.id })
      }

      case 'archive_folder':
      case 'restore_folder': {
        const folder = requestedFolder(folders, action)
        if (!folder) throw new WorkerError('FOLDER_NOT_FOUND', 'Folder tidak ditemukan')
        const archived = action.action === 'archive_folder'
        return envelope(action.action, `Folder “${folder.name}” berhasil ${archived ? 'diarsipkan' : 'dipulihkan'}.`, [
          operation('folder', 'storage.update', 'folders', { archived }, folder.id),
        ], { folder_id: folder.id })
      }

      case 'delete_folder': {
        const folder = requestedFolder(folders, action)
        if (!folder) throw new WorkerError('FOLDER_NOT_FOUND', 'Folder yang akan dihapus tidak ditemukan')
        return envelope('delete_folder', `Folder “${folder.name}” berhasil dihapus.`, [
          operation('folder', 'storage.delete', 'folders', {}, folder.id),
        ], { folder_id: folder.id })
      }

      case 'list_notes':
      case 'answer':
      case 'clarify':
        if (!String(action.reply || '').trim()) throw new WorkerError('INVALID_REPLY', 'Balasan wajib tersedia')
        return envelope(action.action, String(action.reply).trim())

      default:
        throw new WorkerError('UNSUPPORTED_ACTION', `Action ${action.action || ''} tidak didukung Notes`)
    }
  },
  async onMessage(event, ctx) {
    const createFolder = event.text.match(/^\s*(?:tolong\s+)?buat(?:kan)?\s+folder\s+(.+)$/i)
    if (createFolder?.[1]) {
      const name = humanName(createFolder[1])
      const existing = await availableFolders(ctx)
      if (existing.some(folder => searchable(folder.name) === searchable(name))) throw new WorkerError('FOLDER_EXISTS', `Folder ${name} sudah tersedia`)
      const folder = { id: crypto.randomUUID(), name, position: existing.length, created_at: new Date().toISOString() }
      await ctx.storage.create('folders', folder)
      await ctx.chat.reply(`Folder ${name} dibuat.`)
      return folder
    }

    const folders = await availableFolders(ctx)
    const requestedFolder = explicitFolder(event.text)
    const folder = selectFolder(folders, event.text, requestedFolder)
    const content = event.text
      .replace(/^\s*(?:tolong\s+)?(?:catat(?:kan)?|simpan|buat\s+catatan)\s*(?:bahwa\s+)?/i, '')
      .replace(/(?:ke|di|dalam)\s+folder\s+["']?[^"':,]+["']?\s*[:,]\s*/i, '')
      .trim()
    const note = noteInput({ content, folder_id: folder.id, folder: folder.name })
    await ctx.storage.create('notes', note)
    await ctx.chat.reply(`Tersimpan di ${note.folder}: ${note.title}`)
    return note
  },
  actions: {
    list: async (_, ctx) => ctx.storage.list('notes'),
    create: async (input, ctx) => ctx.storage.create('notes', noteInput(input)),
    'folders.list': async (_, ctx) => availableFolders(ctx),
  },
})
