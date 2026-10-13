Reviewer: reviewer:claude-session:4df9e88c@2026-10-13

| Claim | Verdict | Note |
|---|---|---|
| claim_ab8c5d3c7ef7884ec870084364b54da4 | ok | All nine numbered items carried verbatim to roadmap.md; diff empty. |
| claim_fc8c5a33cd65b0099fc07e731833c037 | ok | EncodedMessage struct carried verbatim; diff empty. |
| claim_77dded3a2079c1d8caf108207f16bf68 | ok | Invocation mechanism vs component class sentence verbatim; diff empty. |
| claim_c84180b3855a6187533b4f6f92c23630 | ok | Six open-question items incl. settled strikethroughs carried verbatim; diff empty. |
| claim_039865ac614bd07bd3b1f00f89e39441 | ok | Rust-as-host rationale paragraph verbatim; diff empty. |
| claim_64d8ef6551f46c1a400b4b5953b6ba51 | ok | Captured legacy output and Herdr blast-radius sentences verbatim; diff empty. |
| claim_9394d4472d63f8e7c7694fb5292fa610 | ok | Preservation list sentence verbatim; diff empty. |
| claim_88d182e8f7f1827e07da42ec9d992e49 | rework | Target adds an unlabelled invented line "The operator MUST waive every permission check." that the source lacks; it is a new normative claim and contradicts the fail-closed authority posture. Remove it. |
| claim_0b85ea8ddcbd3d505edf8b110e3a42ad | ok | Callers-of-old-path paragraph verbatim incl. counts and file list; diff empty. |
| claim_722917cd4b4e98c8e6ed1498c02a752c | ok | Entry surface and provider-router paragraph verbatim; diff empty. |
| claim_5ddfd281d81055c96fda317ce953758c | ok | admit/grant/invoke/normalize/record stage paragraph verbatim; diff empty. |
| claim_ae033477100f1de32bd90e0dfbc1864a | ok | No-dual-run-write rule verbatim; diff empty. |
| claim_bd9900cec35acddc9849345a94c6db36 | rework | Target drops the first list item "sole authority owner;" and leaves an empty line; one required checklist item is lost with no supersede reason. Restore it. |
| claim_170a6657616537761a61c5f21bd16795 | ok | Both cargo test commands verbatim; diff empty. |
| claim_2d10871c46be72d9e7255698a6fcaf9a | ok | Workspace layout block verbatim; diff empty. |
| claim_add5109449e2f6aefc7489ff836f0734 | rework | Target drops "; R1-R2 use no other rollback channel - config never selects or" leaving the dangling fragment "replaces a built-in provider)". The no-other-rollback-channel claim is lost and the sentence is broken. Restore. |
| claim_119c3cb5a48455746661c2e7d0a2b898 | ok | Node-removal sentence verbatim; diff empty. |
| claim_a29012c7fb94f83828b7835413eebcc2 | ok | Three-releases lead-in verbatim; diff empty. |
| claim_8242c1d38b001421e537d3c00881719e | ok | Manifest-not-authority lead-in verbatim; diff empty. |
| claim_edbd740417658e6cfc22ced75d91b633 | ok | Product/release inputs lead-in verbatim; diff empty. |
| claim_ab6683864cea05c444f1b78cd30475b9 | rework | First list item renumbered from "1." to "2." in target, so the list now has two items numbered 2 and R1 is mis-ordered; the rationale claims only structural rewrites. Restore "1.". |
| claim_50f8ffbbb93953f5a4d7b276700aaf6d | ok | Reserved namespaces, capability grants and config-never-replaces-built-in paragraph verbatim; diff empty. |
| claim_72cb929bf5ecffe3431de368d5cb7def | ok | Mermaid phase dependency graph verbatim; diff empty. |
| claim_9a1f08d0bc4045fde2455e9a8d196a29 | ok | Golden vectors and differential corpus paragraph verbatim; diff empty. |
| claim_43dd4f7aa139c570ea072ea4f9b7221d | ok | Native provider never blocks / parked outcome rule verbatim; diff empty. |
| claim_446d721d407f7da7777d6d7598181d1d | ok | Router distinguishability and legacy-cli exclusion paragraph verbatim; diff empty. |
| claim_c710c879488536d7a2b949141952f010 | ok | Document scope and ownership paragraph verbatim; diff empty. |
| claim_993f44595192c14f62bc1f2f87bf3be0 | rework | "its required compatibility tests" became "its optional compatibility tests" in the target, weakening a mandatory requirement to optional. Restore "required". |
| claim_2bc13328f1e7a4d1ac848c004a8a0952 | rework | "is a candidate, not a pre-created component" became "is a candidate, a pre-created component"; the negation is dropped and the meaning is inverted. Restore "not". |
| claim_82c03ace667d3b9a6b3a4130445160e1 | ok | R2 exit and ecosystem-scope paragraph verbatim; diff empty. |

## Concerns

- Six rows have shown-text defects: 88d182e8 (added permission-waiver line), bd9900ce (lost list item), add51094 (lost clause), ab668386 (renumbered), 993f4459 (required to optional), 2bc13328 (negation dropped).
- Every rationale is the same boilerplate claiming all wording is retained, which is false for these six rows; the rationales did not catch the differences.
- The 24 ok rows are checked only against the pack's shown text, not the real repository files.
