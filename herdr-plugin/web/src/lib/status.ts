// Status → semantic color bucket, shared by Taskboard and TaskDetail so
// the same status always reads the same color everywhere (D16/D17,
// docs/history/herdr-web-dashboard/CONTEXT.md). The board GROUPS by the
// item's raw `status` string (src/state/work.mjs's STATUSES), not by
// this bucket -- this only decides which of the 4 mockup colors
// (amber/blue/slate/green) a given raw status renders with.

export interface StatusColor {
  text: string
  bg: string
  bar: string
  barBorder: string
}

// Literal class names throughout (never string-built at runtime) --
// Tailwind's JIT scanner only picks up classes it can find verbatim in
// source text.
const NEEDS_ANSWER = {
  text: 'text-status-needs-answer',
  bg: 'bg-status-needs-answer-bg',
  bar: 'bg-status-needs-answer-bar',
  barBorder: 'border-status-needs-answer-bar',
}
const IN_PROGRESS = {
  text: 'text-status-in-progress',
  bg: 'bg-status-in-progress-bg',
  bar: 'bg-status-in-progress-bar',
  barBorder: 'border-status-in-progress-bar',
}
const TODO = {
  text: 'text-status-todo',
  bg: 'bg-status-todo-bg',
  bar: 'bg-status-todo-bar',
  barBorder: 'border-status-todo-bar',
}
const DONE = {
  text: 'text-status-done',
  bg: 'bg-status-done-bg',
  bar: 'bg-status-done-bar',
  barBorder: 'border-status-done-bar',
}

const BUCKET: Record<string, StatusColor> = {
  'awaiting-human': NEEDS_ANSWER,
  'awaiting-approval': NEEDS_ANSWER,
  blocked: NEEDS_ANSWER,
  doing: IN_PROGRESS,
  retrospective: IN_PROGRESS,
  cleanup: IN_PROGRESS,
  todo: TODO,
  backlog: TODO,
  done: DONE,
  delivered: DONE,
}

export function statusColor(status: string): StatusColor {
  return BUCKET[status] ?? TODO
}
