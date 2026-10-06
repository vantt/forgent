# Live check, 2026-10-05

Read-only `reviewed` run from the forgentX checkout (`node bin/fgos.mjs run --pattern reviewed`), producer xai (`pi-herdr-vantt`),
reviewer glm (`pi-cli-bwrap-openrouter`, z-ai/glm-5.2), unit `architecture:shape`, outcome pass, 85 s.

- Producer assignment: objective is the plain task, no context refs.
- Reviewer assignment: objective starts "You are the reviewer of work another agent just did. Do not do the work again and do not change any file."
  and quotes the task; one context ref, the producer's report.
- Reviewer's report (`live-reviewer-report.md`): reads the producer's report and the file under review, checks each claim
  (purpose, the single exported function, behaviour) against the file, verdict PASS with evidence. It reviews; it does not redo the task.

Compare the mdview dogfood of 2026-10-04: the same role got the producer's objective, tried to edit a file and ended `blocked`.

Also checked: `glm` through pi in bwrap works as a read-only checker role and writes its report to `worker-output/outbox`.
