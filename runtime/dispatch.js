import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

function safeError(error) {
  return {
    code: typeof error?.code === 'string' ? error.code : 'WORKER_EXECUTION_FAILED',
    message: typeof error?.message === 'string' ? error.message : 'Worker package execution failed',
    details: error?.details && typeof error.details === 'object' ? error.details : {},
  }
}

async function main() {
  const [entryPath, requestPath] = process.argv.slice(2)
  if (!entryPath || !requestPath) throw new Error('Worker entry and request path are required')

  const request = JSON.parse(await readFile(requestPath, 'utf8'))
  const module = await import(pathToFileURL(entryPath).href)
  const worker = module.default
  if (!worker || typeof worker.onAction !== 'function') throw new Error('Worker does not implement onAction')

  const envelope = await worker.onAction(request.action, request.context || {})
  process.stdout.write(JSON.stringify({ ok: true, envelope }))
}

main().catch(error => {
  process.stdout.write(JSON.stringify({ ok: false, error: safeError(error) }))
  process.exitCode = 1
})
