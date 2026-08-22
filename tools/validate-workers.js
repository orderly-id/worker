import { access, readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

const root = new URL('../workers/', import.meta.url)
const required = ['schema_version', 'id', 'name', 'slug', 'version', 'description', 'publisher', 'permissions']
const ids = new Set()
const instanceNames = new Set()
let count = 0

function packageFile(manifestPath, reference) {
  if (typeof reference !== 'string' || !reference.trim()) throw new Error(`${manifestPath}: file reference must be a non-empty string`)
  const packageRoot = dirname(manifestPath)
  const resolved = resolve(packageRoot, reference)
  const relativePath = relative(packageRoot, resolved)
  if (relativePath.startsWith('..') || relativePath.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)) throw new Error(`${manifestPath}: file reference escapes Worker package`)
  return resolved
}

for (const publisher of await readdir(root)) {
  for (const slug of await readdir(new URL(`${publisher}/`, root))) {
    const path = join(root.pathname, publisher, slug, 'orderly.worker.json')
    let manifest
    try { manifest = JSON.parse(await readFile(path, 'utf8')) } catch { continue }
    const missing = required.filter(key => manifest[key] === undefined)
    if (missing.length) throw new Error(`${path}: missing ${missing.join(', ')}`)
    if (manifest.slug !== slug) throw new Error(`${path}: slug must match directory`)
    if (ids.has(manifest.id)) throw new Error(`${path}: duplicate id ${manifest.id}`)
    const defaultName = manifest.instance?.default_name
    if (typeof defaultName !== 'string' || !/^[a-z0-9]+(?:[a-z0-9_-]*[a-z0-9])?$/.test(defaultName)) throw new Error(`${path}: instance.default_name must be route-safe`)
    if (instanceNames.has(defaultName)) throw new Error(`${path}: duplicate instance.default_name ${defaultName}`)
    if (!Array.isArray(manifest.permissions)) throw new Error(`${path}: permissions must be an array`)
    if (manifest.assets?.avatar) await access(join(root.pathname, publisher, slug, manifest.assets.avatar))
    if (manifest.ai) {
      if (manifest.ai.provider !== 'platform') throw new Error(`${path}: ai.provider must be platform`)
      const inlinePrompt = typeof manifest.ai.system_prompt === 'string' && manifest.ai.system_prompt.trim()
      const promptFile = manifest.ai.system_prompt_file
      if (!inlinePrompt && !promptFile) throw new Error(`${path}: ai.system_prompt or ai.system_prompt_file is required`)
      if (promptFile) await access(packageFile(path, promptFile))
      const inlineSchema = manifest.ai.action_schema && typeof manifest.ai.action_schema === 'object'
      const schemaFile = manifest.ai.action_schema_file
      if (!inlineSchema && !schemaFile) throw new Error(`${path}: ai.action_schema or ai.action_schema_file is required`)
      if (schemaFile) JSON.parse(await readFile(packageFile(path, schemaFile), 'utf8'))
      if (manifest.ai.examples_file) {
        const examples = JSON.parse(await readFile(packageFile(path, manifest.ai.examples_file), 'utf8'))
        if (!Array.isArray(examples)) throw new Error(`${path}: ai.examples_file must contain a JSON array`)
      }
    }
    ids.add(manifest.id); instanceNames.add(defaultName); count += 1
  }
}
if (!count) throw new Error('No Worker manifests found')
console.log(`Validated ${count} Worker manifests`)
