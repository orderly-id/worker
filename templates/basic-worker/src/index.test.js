import test from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'
import { createTestContext, dispatchMessage } from '../../../sdk/testing.js'

test('replies to a chat message', async () => {
  const harness = createTestContext()
  await dispatchMessage(worker, 'hello', harness.ctx)
  assert.equal(harness.replies[0], 'Received: hello')
})
