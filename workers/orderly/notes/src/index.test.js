import test from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'
import { createTestContext, dispatchAction, dispatchMessage, dispatchWorkerAction } from '../../../../sdk/testing.js'

test('creates a note from chat and lists it', async () => {
  const harness = createTestContext()
  await dispatchMessage(worker, 'catat Rapat Jumat pukul 10', harness.ctx)
  const notes = await dispatchAction(worker, 'list', {}, harness.ctx)
  assert.equal(notes.length, 1)
  assert.match(harness.replies[0], /Tersimpan/)
})

test('normalizes a new folder and infers it from natural language', async () => {
  const harness = createTestContext()
  await dispatchMessage(worker, 'buat folder kerja', harness.ctx)
  await dispatchMessage(worker, 'buat catatan kerja tentang rapat Jumat', harness.ctx)
  const folders = await dispatchAction(worker, 'folders.list', {}, harness.ctx)
  const notes = await dispatchAction(worker, 'list', {}, harness.ctx)

  assert.equal(folders.find(folder => folder.name === 'Kerja')?.name, 'Kerja')
  assert.equal(notes[0].folder, 'Kerja')
  assert.equal(notes[0].title, 'Kerja tentang rapat Jumat')
})

test('plans a validated storage capability instead of mutating Core directly', async () => {
  const envelope = await dispatchWorkerAction(worker, {
    action: 'create_note',
    title: 'rencana kerja',
    content: 'catatan kerja tentang rapat Jumat',
    reply: 'Disimpan.',
  }, {
    state: {
      default_folder_id: 'default-id',
      folders: [
        { id: 'default-id', name: 'Default Folder' },
        { id: 'work-id', name: 'Kerja' },
      ],
      notes: [],
    },
  })

  assert.equal(envelope.action, 'create_note')
  assert.equal(envelope.operations[0].capability, 'storage.create')
  assert.equal(envelope.operations[0].resource, 'notes')
  assert.equal(envelope.operations[0].input.folder_id, 'work-id')
  assert.equal(envelope.operations[0].input.title, 'Rencana kerja')
})

test('rejects a hallucinated explicit folder id instead of falling back', async () => {
  await assert.rejects(
    dispatchWorkerAction(worker, {
      action: 'create_note',
      folder_id: 'missing-id',
      content: 'Test',
      reply: 'Disimpan.',
    }, {
      state: {
        default_folder_id: 'default-id',
        folders: [{ id: 'default-id', name: 'Default Folder' }],
        notes: [],
      },
    }),
    error => error.code === 'FOLDER_NOT_FOUND',
  )
})

test('plans Important and Archive updates without moving the item', async () => {
  const state = {
    default_folder_id: 'default-id',
    folders: [
      { id: 'default-id', name: 'Default Folder' },
      { id: 'project-id', name: 'Project' },
    ],
    notes: [
      { id: 'roadmap-id', folder_id: 'project-id', title: 'Roadmap', content: 'Draft' },
    ],
  }

  const important = await dispatchWorkerAction(worker, {
    action: 'mark_note_important',
    note_id: 'roadmap-id',
  }, { state })
  assert.deepEqual(important.operations[0], {
    id: 'note',
    capability: 'storage.update',
    resource: 'notes',
    input: { important: true },
    target_id: 'roadmap-id',
  })

  const archived = await dispatchWorkerAction(worker, {
    action: 'archive_folder',
    folder_id: 'project-id',
  }, { state })
  assert.deepEqual(archived.operations[0], {
    id: 'folder',
    capability: 'storage.update',
    resource: 'folders',
    input: { archived: true },
    target_id: 'project-id',
  })
})

test('does not infer an archived folder for a new note', async () => {
  const envelope = await dispatchWorkerAction(worker, {
    action: 'create_note',
    title: 'Project plan',
    content: 'Project plan for Monday',
  }, {
    state: {
      default_folder_id: 'default-id',
      folders: [
        { id: 'default-id', name: 'Default Folder' },
        { id: 'project-id', name: 'Project', archived_at: '2026-08-29T00:00:00Z' },
      ],
      notes: [],
    },
  })

  assert.equal(envelope.operations[0].input.folder_id, 'default-id')
})
