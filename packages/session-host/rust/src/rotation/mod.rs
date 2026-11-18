//! What a head session's rotation hook knows, without any process, socket or Identity: how full the context
//! window is (`measure`), whether that means rotate now (`decide`, with the `sessionRotation` config it reads), and
//! the handoff a successor reads (`handoff`). The hook wiring in the host app only gathers facts, asks these and
//! sends the verbs; the rotation itself is the executor's (`src/session-rotation/rotate.mjs`).
//! Contract of the files read: `packages/session-host/contracts/rotation-files.v1.json`.

pub mod decide;
pub mod handoff;
pub mod measure;
