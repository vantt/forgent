# Architectural Proposal: Emitter-Aware Grammar Parsing

## The Problem with the Current Architecture
The current implementation in `block-classify.ts` relies on **heuristic regular expressions** applied to plain text devoid of context. It has to guess if a shape is a table, a Claude menu, or a git graph. This leads to an arms race of adding specific regexes (like `MENU_CURSOR_ITEM` or `SUMMARY_QUESTION`) for every new agent or CLI tool, making the code brittle and tightly coupled to the exact output formats of third-party tools.

## Proposed Architecture: Emitter Context + Declarative Grammars
Instead of inspecting anonymous blocks of text, we shift to a **Context-Driven Parsing** model.

### 1. Out-of-Band Emitter Context
The terminal emulator / backend knows what process is currently writing to stdout (via shell integration, `OSC 133` prompts, or `/proc`). It tags incoming blocks with the active command context (e.g., `emitter: "claude-code"`, `emitter: "git"`, `emitter: "ls"`).

### 2. Declarative Grammar Registry
We replace the hardcoded heuristic functions with a registry of declarative parsers (e.g., using parser combinators). 
- `claude-code` gets a specific grammar that defines its interactive menus, summary lists, and markdown tables.
- `git log` gets a grammar that understands branch graphs.
- Generic tools get a generic columnar/table grammar.

### 3. Structural AST (Abstract Syntax Tree)
When a block is emitted, the classifier fetches the grammar for the active emitter and attempts to parse the block.
- If the block successfully parses into a structural AST node (e.g., `MenuNode`, `TableNode`, `GraphNode`), it is classified as `mode: "pan"`.
- If parsing fails or yields a `ProseNode`, it defaults to `mode: "wrap"`.

## Advantages
- **Eliminates False Positives:** We stop looking for Claude's `❯` menu cursor in the output of `cat some_script.sh` because the Claude grammar is only active when Claude is running.
- **Maintainability:** New agent layouts are supported by adding a declarative grammar, rather than injecting more opaque regexes into a global heuristics function.
- **Semantic Rendering:** By parsing into an AST, we not only know *whether* to pan/wrap, but we also know *what* the structure is, enabling future features like semantic copying, accessible screen-reader tables, or rendering native UI components over terminal text.
