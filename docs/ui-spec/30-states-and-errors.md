# States and errors

Shared state and error catalogue. Surfaces reference these by ID in prose.

## States

### ST-LOADING
Data requested from the gateway, nothing to show yet. Skeleton rows keep
the layout stable so nothing jumps when data lands.

### ST-READY
Data loaded and current.

### ST-EMPTY-BOARD
Signed in, gateway reachable, but the project has no work items at all.
Distinct from ST-EMPTY-FILTER: nothing exists, versus nothing matches.

### ST-EMPTY-FILTER
Items exist, but the active filter/grouping matches none. Always shows
what the active filter is and offers to clear it — a person must never be
left guessing why the board looks empty.

### ST-EMPTY-QUESTIONS
Nothing is waiting on a person. This is the good state and reads as such,
not as an error.

### ST-NEVER-PARKED
A task detail whose item has never been parked. Its question/answer
timeline is legitimately empty — normal, not an error
(`docs/specs/herdr-web-dashboard.md` Edge Cases Settled).

### ST-NARRATIVE-MISSING
A task detail whose item points at a documentation directory that does not
exist. The item still renders; the narrative region says the narrative is
missing and names the path it looked for.

### ST-SUBMITTING
A write is in flight. The control that started it is the one that shows
the progress, and it is the only thing disabled — the rest of the screen
stays readable.

### ST-DISCONNECTED
The gateway is unreachable. Data already on screen is marked stale
explicitly, and a retry is offered. Never presented as current.

## Errors

### ERR-AUTH
Sign-in failed. One message for every cause — wrong token, malformed
request, unknown route — per R3. Never distinguishes.

### ERR-WRITE-REFUSED
The gateway ran the verb and fgOS refused it (a lifecycle rule said no).
The engine's own refusal text is shown verbatim; the UI never paraphrases
it into something friendlier and less true.

### ERR-APPROVE-UNAVAILABLE
Approve-merge cannot run because the gateway is not positioned at the
repository's main working tree (R7). Shown as a disabled control with the
reason attached, before the person clicks — not as a failure after.

### ERR-NARRATIVE-PATH
The item's documentation reference resolved outside the documentation
tree and was refused. Shown in the narrative region, not as a page-level
failure.
