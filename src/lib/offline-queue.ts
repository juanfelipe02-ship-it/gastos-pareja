interface QueuedAction {
  id: string
  table: string
  type: 'insert' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: number
}

const QUEUE_KEY = 'gastos_offline_queue'

export function getQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
  const queue = getQueue()
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter((a) => a.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}
