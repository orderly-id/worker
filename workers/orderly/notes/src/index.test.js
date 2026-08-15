import test from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'
import { createTestContext, dispatchAction, dispatchMessage } from '../../../../sdk/testing.js'

test('creates a note from chat and lists it', async () => {
  const harness = createTestContext()
  await dispatchMessage(worker, 'catat Rapat Jumat pukul 10', harness.ctx)
  const notes = await dispatchAction(worker, 'list', {}, harness.ctx)
  assert.equal(notes.length, 1)
  assert.match(harness.replies[0], /Tersimpan/)
})
