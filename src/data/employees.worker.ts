import { generateEmployees } from './employees'

self.onmessage = (e: MessageEvent<{ count: number; seed?: number }>) => {
  const rows = generateEmployees(e.data.count, e.data.seed)
  self.postMessage(rows)
}
