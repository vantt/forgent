# Stop Payload Lists: session_crons and background_tasks

Recorded on 2026-11-22 via throwaway Claude Code session with a Stop hook capture dump.
The dump is stored under `.fgos/runtime/tmp/stop-payload.json`.

## Element Shapes

### `session_crons`
Element fields observed in Stop payload:
- `id`: `string` — internal session job identifier (e.g. `"22dce918"`)
- `schedule`: `string` — cron expression string (e.g. `"*/10 * * * *"`)
- `recurring`: `boolean` — whether the cron recurs (`true`) or runs once (`false`)
- `prompt`: `string` — the prompt enqueued on cron trigger (e.g. `"say hi"`)

Fields kept in `stopFacts.sessionCrons` to recreate the cron:
- `schedule`
- `prompt`
- `recurring` (boolean flag)

### `background_tasks`
Element fields observed in Stop payload:
- `id`: `string` — task identifier (e.g. `"b046td21n"`)
- `type`: `string` — task type (e.g. `"shell"`)
- `status`: `string` — execution status (e.g. `"running"`)
- `description`: `string` — human description (e.g. `"Sleep 30 seconds in background"`)
- `command`: `string` — shell command executed (e.g. `"sleep 30"`)

Fields kept in `stopFacts.backgroundTasks` to report running tasks to successor:
- `id`
- `description`
- `command`
