Role: Alternative Shaper | Cell: P01.2 | Requested: `agy` via bwrap, tier `analytical` | Derived: provider `gemini`, model `gemini-3.1-pro-low`
Dispatch: bwrap (kongming-verified scratch-bind pattern)
Prompt: `proofs/P01.2/prompts/alternative-shaper.md` (isolated -- no sibling proposal visible)
Raw run: `proofs/P01.2/runs/4-alternative-shaper-raw.log` (interleaved with agy's own internal telemetry log noise, EROFS-swallowed as expected; cleaned here for readability, no content altered beyond removing interleaved noise lines)

---

## Priors Applied
1. **Activity signals actual priority (Investment follows value):** A component with 0 commits since July 20, a frozen version (`0.1.0` vs workspace `0.7.6`), disabled bundling, and no tests or CI is a stalled spike. It is not currently a primary product surface.
2. **Reversibility is the primary metric for spikes:** When dealing with an "experimental" surface of uncertain future, the optimal architecture is the one that makes the spike cheapest to delete. Reimplementation of domain logic in a spike maximizes sunk cost; keeping it thin or deleting it maximizes reversibility.

## The Candidate: Delete the Experiment
The best architecture for the desktop shell is to remove it from the repository entirely.

Instead of deciding between thin-client strain (launcher coordination) and thick-client cost (reimplementing the registry/search/render logic in the desktop package), you should formally pause the native shell experiment and delete its 144 lines of code.

The scout report shows the daemon is thriving (recent capability growth in background indexing, short-links, and editing) and successfully serving other clients (CLI, MCP) that bypass the HTTP daemon and share the SQLite registry directly. The desktop shell, meanwhile, is abandoned and causing operational drag (cold-start races, wrong-port fallback, raw-bind-host bugs) without contributing active product value. 

By deleting the shell:
- You instantly eliminate the launcher coordination strain.
- You relieve the single maintainer of supporting an unused surface.
- If a native desktop app is validated as a product necessity in the future, 144 lines of thin-client wrapper can be recreated in an afternoon.

## The Smaller Path: The "Launcher Fix" (Strict Thin Client)
If deleting the shell is unpalatable to the maintainer, the smaller path is to reframe the premise: this is not an architecture boundary problem, it is a deployment bug.

- **Consequences:** The shell remains exactly as it is (a pure web view pointed at the daemon). You do not acquire local ownership. Instead, you spend your complexity budget strictly on fixing the cold-start race and the raw-bind-host bug in the launcher coordination logic.
- **Trigger:** You explicitly defer any architectural shift until a verifiable metric (e.g., user-perceived UI latency) proves that the HTTP daemon hop is an actual bottleneck for a real workflow. Until that trigger fires, no domain logic crosses into the shell.

## Abandoned Alternative
**The "Read-Only Local Search" (Partial Ownership):** I considered a variant where the shell behaves like the CLI/MCP—opening a direct, read-only connection to the shared SQLite registry for fast local search, while delegating writes and rendering to the daemon. 

*Why I abandoned it:* Opening the SQLite file directly from a GUI introduces concurrent file locking complexity and requires building out a local `Engine` inside the desktop shell. For a feature with disabled bundling and zero CI coverage, this is a massive over-investment that violates the core prior of reversibility.

## Falsification Criteria
My candidate (delete the shell) or smaller path (fix the launcher only) is wrong if:
- The lack of commits since July is misleading (e.g., the maintainer has been building out the daemon's backend specifically to unblock a massive desktop push planned for next week).
- The launcher coordination issues are structurally unfixable as long as the UI and daemon remain separate processes, making local ownership a strict technical necessity rather than an architectural choice.
