import { defineWorker, WorkerError } from '../../../../sdk/index.js'

const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ')
const key = value => clean(value).toLocaleLowerCase('id-ID')
const humanName = value => {
  const text = clean(value)
  return text ? text[0].toLocaleUpperCase('id-ID') + text.slice(1) : ''
}
const operation = (id, capability, resource, input = {}, targetId) => ({ id, capability, resource, input, ...(targetId ? { target_id: targetId } : {}) })
const envelope = (action, reply, operations = [], output = {}) => ({ version: '1', action, reply, operations, output })

function findCategory(state, action) {
  const categories = Array.isArray(state?.categories) ? state.categories : []
  return categories.find(item => action.category_id && item.id === action.category_id)
    || categories.find(item => action.category && key(item.name) === key(action.category))
}

function findItem(state, action) {
  const items = Array.isArray(state?.menu_items) ? state.menu_items : []
  return items.find(item => action.item_id && item.id === action.item_id)
    || items.find(item => action.name && key(item.name) === key(action.name))
}

export default defineWorker({
  async onAction(action, context) {
    const state = context?.state || {}
    switch (action.action) {
      case 'create_category': {
        const name = humanName(action.category)
        if (!name) throw new WorkerError('INVALID_CATEGORY', 'Nama kategori wajib diisi')
        return envelope('create_category', action.reply || `Kategori “${name}” dibuat.`, [
          operation('category', 'storage.create', 'menu_categories', { name }),
        ], { category_id: { $result: 'category.id' } })
      }
      case 'rename_category': {
        const category = findCategory(state, action)
        const name = humanName(action.new_category)
        if (!category || !name) throw new WorkerError('CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan')
        return envelope('rename_category', action.reply || `Kategori diubah menjadi “${name}”.`, [
          operation('category', 'storage.update', 'menu_categories', { name }, category.id),
        ], { category_id: category.id })
      }
      case 'delete_category': {
        const category = findCategory(state, action)
        if (!category) throw new WorkerError('CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan')
        return envelope('delete_category', action.reply || `Kategori “${category.name}” dihapus.`, [
          operation('category', 'storage.delete', 'menu_categories', {}, category.id),
        ], { category_id: category.id })
      }
      case 'create_menu_item': {
        const category = findCategory(state, action) || state.categories?.[0]
        const name = humanName(action.name)
        if (!category || !name || !Number.isInteger(action.price) || action.price < 0) throw new WorkerError('INVALID_ITEM', 'Kategori, nama, dan harga menu wajib diisi')
        const input = { category_id: category.id, name, description: clean(action.description), price: action.price, available: action.available !== false }
        return envelope('create_menu_item', action.reply || `${name} ditambahkan ke “${category.name}”.`, [
          operation('item', 'storage.create', 'menu_items', input),
        ], { item_id: { $result: 'item.id' }, category_id: category.id })
      }
      case 'update_menu_item': {
        const item = findItem(state, action)
        if (!item) throw new WorkerError('ITEM_NOT_FOUND', 'Menu tidak ditemukan')
        const category = action.category_id || action.category ? findCategory(state, action) : null
        if ((action.category_id || action.category) && !category) throw new WorkerError('CATEGORY_NOT_FOUND', 'Kategori tujuan tidak ditemukan')
        const input = {}
        if (action.new_name) input.name = humanName(action.new_name)
        if (action.description !== undefined && action.description !== null) input.description = clean(action.description)
        if (Number.isInteger(action.price) && action.price >= 0) input.price = action.price
        if (typeof action.available === 'boolean') input.available = action.available
        if (category) input.category_id = category.id
        if (!Object.keys(input).length) throw new WorkerError('EMPTY_UPDATE', 'Tidak ada perubahan menu')
        return envelope('update_menu_item', action.reply || `Menu “${item.name}” diperbarui.`, [
          operation('item', 'storage.update', 'menu_items', input, item.id),
        ], { item_id: item.id })
      }
      case 'delete_menu_item': {
        const item = findItem(state, action)
        if (!item) throw new WorkerError('ITEM_NOT_FOUND', 'Menu tidak ditemukan')
        return envelope('delete_menu_item', action.reply || `Menu “${item.name}” dihapus.`, [
          operation('item', 'storage.delete', 'menu_items', {}, item.id),
        ], { item_id: item.id })
      }
      case 'list_menu':
      case 'answer':
      case 'clarify':
        if (!clean(action.reply)) throw new WorkerError('INVALID_REPLY', 'Balasan wajib tersedia')
        return envelope(action.action, clean(action.reply))
      default:
        throw new WorkerError('UNSUPPORTED_ACTION', `Action ${action.action || ''} tidak didukung FnB Order Management System`)
    }
  },
})
