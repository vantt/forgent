const fs = require('fs');
const file = '.github/workflows/ci.yml';
let content = fs.readFileSync(file, 'utf8');

const anchor = `      - name: Download base artifact
        run: |
          gh run download --name full-results-ubuntu-latest --dir artifacts/base-results/test-results || echo "Failed to download base artifact"
          if [ -f artifacts/base-results/test-results/full.xml ]; then
            mv artifacts/base-results/test-results/full.xml artifacts/base-results/test-results/base.xml
          fi
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`;

const replacement = `      - name: Download base artifact
        if: github.event_name == 'pull_request'
        run: |
          BASE_SHA=\${{ github.event.pull_request.base.sha }}
          RUN_ID=$(gh run list --commit $BASE_SHA --workflow CI --json databaseId --jq '.[0].databaseId' || true)
          if [ -z "$RUN_ID" ] || [ "$RUN_ID" == "null" ]; then
            RUN_ID=$(gh run list --branch \${{ github.event.pull_request.base.ref }} --workflow CI --status success --json databaseId --jq '.[0].databaseId' || true)
          fi
          if [ -n "$RUN_ID" ] && [ "$RUN_ID" != "null" ]; then
            gh run download $RUN_ID --name full-results-ubuntu-latest --dir artifacts/base-results/test-results || echo "Failed to download base artifact"
            if [ -f artifacts/base-results/test-results/full.xml ]; then
              mv artifacts/base-results/test-results/full.xml artifacts/base-results/test-results/base.xml
            fi
          fi
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`;

content = content.replace(anchor, replacement);
fs.writeFileSync(file, content);
