# Marketing domain: go-to-market pack

Draft personas for sales, marketing and content questions of a small operator. No domain expert has signed them; treat their output as input to your own judgment, never as professional advice.

## Personas (`agents/`)

| Name | Concern |
|---|---|
| `value-chain-strategist` | Which links of the go-to-market chain AI makes cheap, where scarce value remains |
| `offer-pricing-critic` | Packaging, price, entry offer, guarantee risk |
| `buyer-channel-skeptic` | Real buyer pain, first niche, first channel |
| `solo-capacity-checker` | One person's load: sell, deliver, maintain, make content |

Use them on a panel seat as `--seats "@value-chain-strategist|@offer-pricing-critic|@buyer-channel-skeptic"`. Names are copied from the file names; a persona carries posture and a decision boundary, never facts, so pair seats with `--context-ref` documents.

## Make it yours (no manifest, only folders)

- **Replace a persona.** Copy the file to `fgos/agents/<same-name>.yaml` in your project and edit it. The workspace copy replaces the shipped file whole; fields are not merged. The panel pins the text it used when the workflow starts.
- **Add a persona.** Put `fgos/agents/<new-name>.yaml` in your project. Name: lowercase letters, digits and `-`. Keep `name:` equal to the file name, a one-line `description:`, and one-line values under `persona:` (`voice`, `style`, `archetype`) and `decision_boundary:` (`can_decide`, `must_escalate`). Other keys are ignored.
- **Add knowledge.** Put your own facts in `fgos/knowledge/marketing/*.md` (ideal customer, offer, price tests, case notes, channel results) and pass them with `--context-ref`. Start from `templates/`. Seats read the files themselves, so keep them short and current; the persona never carries your numbers.
- **Keep company knowledge out of the shipped pack.** Nothing under `domains/marketing/` should hold client names, prices or results.

## Boundaries

Personas flag unsourced market claims as gaps. They do not decide the market, price or contract terms; those stay with the owner.
