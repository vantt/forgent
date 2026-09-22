import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

async function generateCoverageMap() {
  console.log("Running coverage-map generator...");
  // 1. Lấy danh sách test files
  // 2. Với mỗi test file, tạo NODE_V8_COVERAGE dir riêng
  // 3. Chạy node --test <file>
  // 4. Đọc coverage JSON sinh ra, trích xuất thuộc tính `url`
  // 5. Gom map `source` -> danh sách `tests`
  // 6. Quét AST/regex để gom `import()` literal
  // 7. Ghi JSON và markdown diff

  const outDir = 'plans/260922-test-suite-optimization/reports';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  fs.writeFileSync(path.join(outDir, `coverage-map-${date}.json`), JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    mapping: {} // Skeleton for now
  }, null, 2));

  fs.writeFileSync(path.join(outDir, `coverage-suggestion-${date}.md`), `# Coverage Suggestion Diff\n\n(Generated suggestions)`);
  console.log("Coverage map generated.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateCoverageMap().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
