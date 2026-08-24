import assert from 'node:assert/strict'
import test from 'node:test'
import worker from './index.js'

const context = { state: { categories: [{ id: 'cat-1', name: 'Minuman' }], menu_items: [{ id: 'item-1', category_id: 'cat-1', name: 'Espresso', price: 18000, available: true }] } }

test('plans a menu item creation in an existing category', async () => {
  const result = await worker.onAction({ action: 'create_menu_item', category: 'minuman', name: 'kopi susu', price: 22000, reply: 'Siap.' }, context)
  assert.equal(result.operations[0].resource, 'menu_items')
  assert.deepEqual(result.operations[0].input, { category_id: 'cat-1', name: 'Kopi susu', description: '', price: 22000, available: true })
})

test('plans an availability update without rewriting history', async () => {
  const result = await worker.onAction({ action: 'update_menu_item', name: 'espresso', available: false, reply: 'Espresso habis.' }, context)
  assert.deepEqual(result.operations[0].input, { available: false })
  assert.equal(result.operations[0].target_id, 'item-1')
})
