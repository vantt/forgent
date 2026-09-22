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

/**
 * Cập nhật biến SELECTOR_BREAKER trên GitHub hoặc tạo Issue nếu không có quyền.
 */
export function updateBreakerState(newMisses) {
  if (!newMisses || newMisses.length === 0) return;

  const repoInfo = process.env.GITHUB_REPOSITORY;
  if (!repoInfo) {
    console.warn("GITHUB_REPOSITORY not set, cannot update breaker state.");
    return;
  }

  console.log(`Attempting to quarantine rules: ${newMisses.join(', ')}`);

  let currentState = { version: 1, quarantined: [] };
  try {
    const output = execSync(`gh api repos/${repoInfo}/actions/variables/SELECTOR_BREAKER --jq .value`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (output.trim()) {
      currentState = JSON.parse(output.trim());
    }
  } catch (err) {
    console.log("Variable SELECTOR_BREAKER not found or unreadable, starting fresh.");
  }

  const existingSet = new Set(currentState.quarantined || []);
  let added = false;
  for (const rule of newMisses) {
    if (!existingSet.has(rule)) {
      existingSet.add(rule);
      added = true;
    }
  }

  if (!added) {
    console.log("All rules already quarantined.");
    return;
  }

  currentState.quarantined = Array.from(existingSet);
  const newValue = JSON.stringify(currentState);

  try {
    // Try to update variable
    console.log("Attempting to PATCH SELECTOR_BREAKER variable...");
    // Check if variable exists first by checking if we had success earlier, if not we might need POST, 
    // but the instruction says "ghi lại bằng gh api -X PATCH". We will assume PATCH or POST.
    // Actually, setting a variable using gh api:
    try {
      execSync(`gh api --method PATCH repos/${repoInfo}/actions/variables/SELECTOR_BREAKER -F name="SELECTOR_BREAKER" -F value='${newValue}'`, { stdio: 'pipe' });
      console.log("Successfully updated SELECTOR_BREAKER via API.");
    } catch (patchErr) {
      // If PATCH fails with 404, try POST
      if (patchErr.message.includes('404')) {
        execSync(`gh api --method POST repos/${repoInfo}/actions/variables -F name="SELECTOR_BREAKER" -F value='${newValue}'`, { stdio: 'pipe' });
        console.log("Successfully created SELECTOR_BREAKER via API.");
      } else {
        throw patchErr;
      }
    }
  } catch (err) {
    console.warn("Failed to update Actions variable via GITHUB_TOKEN. Fallback to creating an issue.");
    console.warn(err.message);
    
    // Fallback: Create issue
    const issueTitle = `[Circuit Breaker] Quarantine rules: ${newMisses.join(', ')}`;
    const issueBody = `The compare job detected confirmed misses for the following rules:\n\n${newMisses.map(r => `- \`${r}\``).join('\n')}\n\nSince \`GITHUB_TOKEN\` cannot write repository variables, please manually update the \`SELECTOR_BREAKER\` variable to include these rules.`;
    
    try {
      execSync(`gh issue create --title "${issueTitle}" -F -`, { input: issueBody, stdio: ['pipe', 'inherit', 'inherit'] });
      console.log("Created fallback issue.");
    } catch (issueErr) {
      console.error("Failed to create issue.", issueErr.message);
    }
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
