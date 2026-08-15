import { access, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../workers/', import.meta.url)
const required = ['schema_version', 'id', 'name', 'slug', 'version', 'description', 'publisher', 'permissions']
const ids = new Set()
let count = 0

for (const publisher of await readdir(root)) {
  for (const slug of await readdir(new URL(`${publisher}/`, root))) {
    const path = join(root.pathname, publisher, slug, 'orderly.worker.json')
    let manifest
    try { manifest = JSON.parse(await readFile(path, 'utf8')) } catch { continue }
    const missing = required.filter(key => manifest[key] === undefined)
    if (missing.length) throw new Error(`${path}: missing ${missing.join(', ')}`)
    if (manifest.slug !== slug) throw new Error(`${path}: slug must match directory`)
    if (ids.has(manifest.id)) throw new Error(`${path}: duplicate id ${manifest.id}`)
    if (!Array.isArray(manifest.permissions)) throw new Error(`${path}: permissions must be an array`)
    if (manifest.assets?.avatar) await access(join(root.pathname, publisher, slug, manifest.assets.avatar))
    if (manifest.ai) {
      if (manifest.ai.provider !== 'platform') throw new Error(`${path}: ai.provider must be platform`)
      if (!manifest.ai.system_prompt || typeof manifest.ai.system_prompt !== 'string') throw new Error(`${path}: ai.system_prompt is required`)
      if (!manifest.ai.action_schema || typeof manifest.ai.action_schema !== 'object') throw new Error(`${path}: ai.action_schema is required`)
    }
    ids.add(manifest.id); count += 1
  }
}
if (!count) throw new Error('No Worker manifests found')
console.log(`Validated ${count} Worker manifests`)
