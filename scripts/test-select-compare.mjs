import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * Classifier C1 (Phase 3)
 * Phân loại một test case (dựa trên kết quả run full PR, full Base, related PR)
 */
export function classifyTestCase(options) {
  const { 
    isRedInFull, 
    isRedInBase, 
    baseMissing, 
    isSelected, 
    isRedInRelated, 
    isRelatedRedSomewhere, 
    rerunPassed 
  } = options;

  if (isRedInRelated && !isRedInFull) {
    return 'related-only-fail';
  }
  
  if (!isRedInFull) {
    return 'pass';
  }

  // Nếu tới đây thì chắc chắn là test case này ĐỎ trong job Full PR
  
  if (baseMissing) {
    return 'base-missing'; // inconclusive
  }
  
  if (isRedInBase) {
    return 'baseline-failing'; // inconclusive
  }

  if (isSelected) {
    if (isRedInRelated) {
      return 'caught';
    } else {
      return 'selected-but-divergent'; // inconclusive
    }
  } else {
    if (isRelatedRedSomewhere) {
      return 'omitted-failing-test';
    }
    if (rerunPassed) {
      return 'rerun-pass'; // inconclusive
    }
    return 'confirmed-miss';
  }
}

async function main() {
  console.log("Running compare job logic...");
  
  // TODO: Tải plan, related, full(ubuntu), base(ubuntu)
  // Thực hiện classify cho từng case
  // Rerun confirmed-miss
  // Ghi ledger.json
  // Comment PR
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
