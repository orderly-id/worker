export function defineWorker(definition) {
  if (!definition || typeof definition !== 'object') throw new TypeError('Worker definition must be an object')
  return Object.freeze(definition)
}

export class WorkerError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'WorkerError'
    this.code = code
    this.details = details
  }
}
