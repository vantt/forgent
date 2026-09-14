# Architecture Map

```txt
Document type: Platform architecture map
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through the whole-system architecture map
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor from docs/architecture-map.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/component-boundary.md
- docs/architecture-map.md
```

## 1. Purpose

This is the target platform-docs anchor for the whole-system architecture map.

The legacy full map remains at `docs/architecture-map.md` during migration. Use this file as the stable reader entry in the new documentation system.

## 2. Reading Model

The legacy architecture map organizes fgOS through:

- a structural layer: where code lives and how import direction works;
- a data/physics layer: store, event, state, signal, run;
- an authority layer: who may decide or write which truth;
- component and contract registries.

The target documentation system separates these concerns into clearer anchors:

| Concern | Target doc |
| --- | --- |
| Mission and direction | `vision.md` |
| Durable laws | `platform-foundations.md` |
| Whole-system structure | `architecture-map.md` |
| Component ownership and authority | `component-boundary.md` |
| Area-specific behavior | `docs/platform/<area>/spec.md` |
| Area-specific rationale | `docs/platform/<area>/architecture/` |
| Exact cross-area rules | `docs/platform/<area>/contracts/` or `docs/platform/contracts/` |

## 3. Current Shape

fgOS should be read as a platform with:

```txt
entry / surface
  -> use-case orchestration
  -> side-effect ports and host adapters
  -> domain-neutral engines
  -> durable state/log substrate
  -> domain and extension layers
```

This target anchor intentionally stays compact. Detailed component authority now belongs in `component-boundary.md`.

## 4. Change Rule

If a design changes whole-system structure, do all of the following:

1. Update the owning area docs.
2. Check `component-boundary.md`.
3. Update this architecture map when the structural reading path changes.
4. Link proof or record `No component-boundary change`.

## 5. Legacy Source

`docs/architecture-map.md` is still the full legacy map. Do not delete or rewrite it wholesale until its component and contract registry content has been promoted or redirected.
