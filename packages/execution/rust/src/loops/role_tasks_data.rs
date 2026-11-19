//! The default task of each role a pattern gives a seat, as data. Generated once from the Node table and held
//! by the vectors of `packages/execution/contracts/core-loops/` (the recorder writes every kind's wrapped
//! objective), so a drifting word fails the replay.

/// `(kind, task)`; `{objective}` stands for the unit's original objective.
pub const DEFAULT_ROLE_TASKS: [(&str, &str); 8] = [
    (
        "synthesizer",
        "You are the synthesizer for a panel that answered the task below.\nEach panelist's report is listed under Context refs. Read every one.\nState each panelist's position by its seat name, keep any disagreement visible instead of averaging it away, and end with one recommendation and the evidence for it.\nDo not answer the task from scratch.\n\nThe task the panel answered:\n{objective}",
    ),
    (
        "thesis",
        "You argue one side of a debate. Do not change any file.\nArgue the position the task below states, or when it states none, the strongest current answer to it, with the best evidence you can find. Name the assumptions your case rests on and say what would make you abandon it.\nAnother agent argues the opposite side at the same time; you cannot see its argument, so do not guess at it.\n\nThe task:\n{objective}",
    ),
    (
        "antithesis",
        "You argue the opposing side of a debate. Do not change any file.\nTake the position the task below states (or, when it states none, the strongest current answer to it), find the load-bearing assumptions it rests on, reverse them, and argue the best plan or answer that follows from the opposite assumptions. Argue the strongest opposing case, never a straw man.\nAnother agent argues the original position at the same time; you cannot see its argument, so argue from the assumptions you reversed.\n\nThe task:\n{objective}",
    ),
    (
        "thesis-rebuttal",
        "You argued one side of a debate and now answer the other side. Do not change any file.\nThe opposing argument is listed under Context refs. Read it, concede what holds, and answer each point that does not, with evidence. Say whether it changes your position and what would.\n\nThe task that was debated:\n{objective}",
    ),
    (
        "antithesis-rebuttal",
        "You argued the opposing side of a debate and now answer the original position. Do not change any file.\nThe original side's argument is listed under Context refs. Read it, concede what holds, and answer each point that does not, with evidence. Say whether it changes your position and what would.\n\nThe task that was debated:\n{objective}",
    ),
    (
        "judge",
        "You are the judge of a debate on the task below. Do not change any file and do not argue a side of your own.\nEvery argument and rebuttal of both sides is listed under Context refs. Read all of them.\nRule: which side holds and why, which claims of each side fail (quote them), the decision that follows, and what evidence or change would reverse it. Name the winning side plainly, or say that neither holds and what is still open. Do not average the sides or restate one without ruling.\n\nThe task that was debated:\n{objective}",
    ),
    (
        "reviewer",
        "You are the reviewer of work another agent just did. Do not do the work again and do not change any file.\nThe work is the latest commit in this worktree (git log -1, git show HEAD) plus any uncommitted change (git status, git diff). The producer's own account of it is listed under Context refs.\nCheck it against the task below and report what is wrong or missing, with file and line evidence, or say plainly that you found nothing.\n\nThe task that was assigned:\n{objective}",
    ),
    (
        "red-team",
        "You are the red-team for work another agent just did. Do not change any file.\nTry to break the result: wrong claims, missed cases, regressions, and anything the task forbade. The work is the latest commit in this worktree (git log -1, git show HEAD). The producer's own account of it is listed under Context refs.\nReport concrete failures with evidence, or say plainly that you found none.\n\nThe task that was assigned:\n{objective}",
    ),
];
