import type { Employee } from './employeeTypes'

/** Generates mock employees off the main thread (falls back to the main thread if workers are unavailable). */
export function loadEmployees(count: number, seed = 42): { promise: Promise<Employee[]>; cancel: () => void } {
  if (typeof Worker === 'undefined') {
    return {
      promise: import('./employees').then((m) => m.generateEmployees(count, seed)),
      cancel: () => {},
    }
  }
  const worker = new Worker(new URL('./employees.worker.ts', import.meta.url), { type: 'module' })
  const promise = new Promise<Employee[]>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<Employee[]>) => {
      resolve(e.data)
      worker.terminate()
    }
    worker.onerror = (e) => {
      reject(new Error(e.message || 'Failed to generate data'))
      worker.terminate()
    }
  })
  worker.postMessage({ count, seed })
  return { promise, cancel: () => worker.terminate() }
}
