// vocabulary.mjs -- shared vocabulary and constants for portfolio data model (D-ADR0082)
import fs from 'node:fs';

const VOCAB = JSON.parse(
  fs.readFileSync(
    new URL('../../packages/portfolio/contracts/portfolio-vocabulary.v1.json', import.meta.url),
    'utf8'
  )
);

export const ITEM_REQUIRED_KEYS = Object.freeze(VOCAB.backlogItem.requiredFrontmatter);
export const ITEM_STATUSES = Object.freeze(VOCAB.backlogItem.statuses);
export const ITEM_PRIORITIES = Object.freeze(VOCAB.backlogItem.priorities);
export const ITEM_BODY_SECTIONS = Object.freeze(VOCAB.backlogItem.bodySections);

export const DISCUSSION_REQUIRED_KEYS = Object.freeze(VOCAB.discussion.requiredFrontmatter);
export const DISCUSSION_STATUSES = Object.freeze(VOCAB.discussion.statuses);

export const PLAN_STATUSES = Object.freeze(VOCAB.plan.statuses);

export const BACKLOG_ID_REGEX = /^p-[a-z2-7]{10}$/;
export const DISCUSSION_ID_REGEX = /^ds-[a-z2-7]{10}$/;
