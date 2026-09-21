---
name: okf
type: git-repo
url: https://github.com/GoogleCloudPlatform/open-knowledge-format.git
local: upstreams/okf
last_analyzed_commit: ad30107
last_analyzed_date: 2026-09-21
domains_covered: [docs-style, context-memory, integration-contract, quality-gates, safety, tooling, repo-layout, testing-evals, harness, skills, hooks, workflow, orchestration, routing, planning, config-packaging, self-improvement, ux]
---

# Open Knowledge Format (OKF) — Feature Index

> Full scan of OKF v0.2 at `ad30107`. The important improvement over v0.1 is not a larger schema; it is making provenance, trust, freshness, lifecycle, and attestation queryable while keeping the base format permissive.

## docs-style

### minimal-permissive-knowledge-document
- **What:** A concept is a UTF-8 Markdown file with YAML frontmatter; `type` is the only required key. Unknown types and extra keys are allowed, and the body has no required sections.
- **Where:** `SPEC.md`, `src/reference_agent/bundle/document.py`
- **Notable:** Interoperability comes from a tiny structural floor, not a closed taxonomy. Domain governance can add stricter rules without making the exchange format reject unknown documents.
- **Keywords:** concept, frontmatter, extensions, permissive conformance
- **Seen:** ad30107

### progressive-disclosure-index-files
- **What:** Optional `index.md` files enumerate one directory level, grouped by concept type and carrying title/description links; consumers may generate missing indexes.
- **Where:** `SPEC.md`, `src/reference_agent/bundle/index.py`
- **Notable:** Navigation is a derived projection for progressive disclosure, not another source of truth and not a requirement for validity.
- **Keywords:** index.md, directory listing, progressive disclosure
- **Seen:** ad30107

### scoped-update-log
- **What:** Optional `log.md` records newest-first, date-grouped updates for a directory scope, while reserved filenames are explicitly excluded from concept documents.
- **Where:** `SPEC.md`, `bundles/acme_retail/log.md`
- **Notable:** Local history can travel with a bundle without being confused with concept content or a central registry.
- **Keywords:** log.md, reserved filenames, update log
- **Seen:** ad30107

### graph-links-with-soft-resolution
- **What:** Standard Markdown links express directed relationships beyond the directory tree; bundle-relative absolute links are recommended, but broken links are tolerated.
- **Where:** `SPEC.md`, `src/reference_agent/viewer/generator.py`, `src/reference_agent/viewer/static/viz.js`
- **Notable:** Tree layout is only organization; the knowledge model is graph-shaped. Broken links are visible/incomplete knowledge, not automatic parse failure.
- **Keywords:** cross-linking, bundle-relative links, backlinks
- **Seen:** ad30107

## context-memory

### provenance-as-queryable-source-family
- **What:** `sources` stores per-source resource plus optional stable `id`, title, author, usage count, modification time, and usage window; footnotes keyed by source id attribute individual claims.
- **Where:** `SPEC.md`, `bundles/ga4/tables/events_.md`
- **Notable:** Source identity is keyed rather than positional, so agent rewrites cannot silently misattribute claims when a source list is reordered. Credibility signals are recorded as facts; consumers infer trust rather than storing a subjective score.
- **Keywords:** sources, usage_window, per-claim attribution, credibility signals
- **Seen:** ad30107

### generation-verification-separation
- **What:** `generated` records who/when last meaningfully changed content; `verified` records independent confirmation events. Consumers derive `unverified`, `machine-confirmed`, or `human-reviewed` tiers.
- **Where:** `SPEC.md`, `src/reference_agent/bundle/document.py`, `bundles/acme_retail/metrics/revenue.md`
- **Notable:** Authorship and confirmation are deliberately separate axes. A document can change without being reverified, or be reverified without regeneration.
- **Keywords:** generated, verified, trust tier, actor convention
- **Seen:** ad30107

### explicit-freshness-deadline
- **What:** Optional `stale_after` is an absolute ISO-8601 instant; consumers can mechanically mark a concept stale with `now >= stale_after` without guessing a relative TTL.
- **Where:** `SPEC.md`, `src/reference_agent/bundle/document.py`
- **Notable:** Freshness is explicit and consumer-independent. Invalid or timezone-less values are ignored rather than guessed.
- **Keywords:** stale_after, freshness, ISO 8601
- **Seen:** ad30107

### durable-origin-vs-contribution-history
- **What:** OKF distinguishes current generated metadata and verification events from the content itself; the v0.2 model provides appendable actor/timestamp facts without embedding a full audit log in every document.
- **Where:** `SPEC.md`, `src/reference_agent/bundle/document.py`, `bundles/acme_retail/log.md`
- **Notable:** This is a useful boundary for forgent: compact document metadata, durable event history elsewhere, and a derived trust view.
- **Keywords:** actor, provenance, verification events, log
- **Seen:** ad30107

## quality-gates

### attested-computation-contract
- **What:** An `Attested Computation` is a standalone concept with runtime, typed parameters, sanctioned computation, executor receipt fields, and a deterministic attester. Consumers bind only declared values, execute, then compare the receipt against the sanctioned computation.
- **Where:** `SPEC.md`, `bundles/acme_retail/computations/revenue-ytd.md`, `bundles/acme_retail/attesters/sql_equality.py`
- **Notable:** It separates definition verification from per-run attestation. A value cannot be trusted merely because prose claims an agent ran the right query.
- **Keywords:** Attested Computation, executor, receipt, attester, parameter-only binding
- **Seen:** ad30107

### conformance-softness-with-hard-floor
- **What:** Conformance requires parseable frontmatter, non-empty `type`, and valid reserved files; optional trust/lifecycle/provenance/computation families remain advisory, and unknown types/keys, missing indexes, or broken links do not invalidate a bundle.
- **Where:** `SPEC.md`, `src/reference_agent/bundle/document.py`, `tests/test_document.py`
- **Notable:** A small hard floor preserves interoperability while richer producers and consumers can progressively adopt stronger semantics.
- **Keywords:** conformance, required floor, optional family, unknown type tolerance
- **Seen:** ad30107

## integration-contract

### producer-consumer-separation
- **What:** OKF defines a portable file contract, not a serving runtime, registry, packaging standard, or query infrastructure. The repository's reference agent and viewer are explicitly proof-of-concept producer/consumer implementations.
- **Where:** `README.md`, `SPEC.md`, `src/reference_agent/agent.py`, `src/reference_agent/viewer/generator.py`
- **Notable:** The format remains useful outside the reference implementation. This is a direct model for keeping forgent documentation authority separate from authoring workflows and UI projections.
- **Keywords:** vendor-neutral, producer, consumer, proof of concept
- **Seen:** ad30107

### versioned-best-effort-consumption
- **What:** A bundle may declare `okf_version` in the root index; minor versions add compatible fields, major versions may break, and unknown versions should still be consumed best-effort rather than rejected.
- **Where:** `SPEC.md`, `bundles/ga4/index.md`
- **Notable:** Versioning is explicit but does not turn a consumer into a brittle gate. This supports gradual migration and forwards-compatible readers.
- **Keywords:** okf_version, minor version, best effort
- **Seen:** ad30107

## safety

### bounded-web-enrichment
- **What:** The reference agent's web pass follows only explicit seeds, enforces same-domain allowed hosts, caps page count, and chooses to enrich, create a reference concept, or skip.
- **Where:** `README.md`, `src/reference_agent/tools/web_tools.py`, `src/reference_agent/web/fetcher.py`, `src/reference_agent/prompts/web_ingestion_instruction.md`
- **Notable:** External content is treated as bounded evidence acquisition, not an instruction channel. Scope limits are enforced inside the tool boundary.
- **Keywords:** web-seed, web-max-pages, web-allowed-host, skip/enrich/create
- **Seen:** ad30107

## tooling

### deterministic-frontmatter-roundtrip
- **What:** The parser keeps ISO timestamps as author-written strings instead of PyYAML converting them to datetime objects, preserving frontmatter on parse/serialize round trips.
- **Where:** `src/reference_agent/bundle/document.py`, `tests/test_document.py`
- **Notable:** Serialization must not silently mutate authored metadata. This is small but important for git-diffable documentation.
- **Keywords:** YAML 1.2, timestamp resolver, round-trip
- **Seen:** ad30107

### offline-self-contained-viewer
- **What:** The viewer embeds a bundle into one HTML artifact and renders graph links, backlinks, search, type filters, and multiple layouts without a backend.
- **Where:** `README.md`, `src/reference_agent/viewer/generator.py`, `src/reference_agent/viewer/templates/viz.html`
- **Notable:** A generated read projection can be portable, inspectable, and useful without becoming a source of truth.
- **Keywords:** self-contained HTML, graph viewer, offline consumer
- **Seen:** ad30107

## testing-evals

### consumer-tolerance-contract-tests
- **What:** Tests cover minimal documents, unknown fields/types, bare-versus-list `verified`, stale timestamps, index generation, link handling, and viewer output.
- **Where:** `tests/test_document.py`, `tests/test_index.py`, `tests/test_bundle_tools.py`, `tests/test_viewer.py`
- **Notable:** Compatibility rules are tested at the consumer boundary, not left as prose. Especially valuable are tests for permissive behavior, not only rejection cases.
- **Keywords:** consumer contract, compatibility, permissive tests
- **Seen:** ad30107

## v0.2-delta

### frontmatter-provenance-trust-lifecycle
- **What:** v0.2 supersedes `timestamp` with `generated.at`, moves body `# Citations` into keyed `sources`, and adds `generated`, `verified`, `status`, and `stale_after`.
- **Where:** `SPEC.md`
- **Notable:** The improvement is a move from informal prose conventions to small, queryable metadata families while retaining v0.1 fallbacks.
- **Keywords:** v0.1, timestamp, Citations, migration fallback
- **Seen:** ad30107

### standalone-attested-computations
- **What:** v0.2 adds `Attested Computation`, separating reusable computation contracts from the concepts that consume their values.
- **Where:** `SPEC.md`, `bundles/acme_retail/computations/`, `bundles/acme_retail/attesters/`
- **Notable:** It turns “the agent says it computed this” into an independently checkable contract without standardizing the runtime packaging or receipt wire protocol yet.
- **Keywords:** computation concept, attestation, deferred ABI
- **Seen:** ad30107
