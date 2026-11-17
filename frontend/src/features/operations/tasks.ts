/** Pure task/warranty helpers for the operations feature. */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

/** Next status when a user advances a task. */
export function nextStatus(current: string): TaskStatus {
  if (current === 'PENDING') return 'IN_PROGRESS'
  if (current === 'IN_PROGRESS') return 'COMPLETED'
  return 'PENDING'
}

export function isOverdue(dueDate: string | undefined, now = new Date()): boolean {
  if (!dueDate) return false
  return new Date(dueDate).getTime() < now.getTime()
}

/** Generate a deterministic warranty certificate number. */
export function certificateNo(seed: number): string {
  return `WTY-${seed.toString(36).toUpperCase()}`
}
