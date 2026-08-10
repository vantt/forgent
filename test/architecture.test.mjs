// Giữ bản đồ kiến trúc thật thà bằng máy (architecture-map §9.3, record 0010).
// Hai phép kiểm trên docs/architecture-manifest.json:
//   (a) đủ sổ — mọi file .mjs trong src/ + bin/ có row trong manifest, một-một
//       (file thiếu row VÀ row chỉ file đã xóa đều đỏ);
//   (b) một chiều xuống — mọi import tương đối chỉ trỏ cùng tầng hoặc tầng sâu
//       hơn theo thứ tự layers của manifest; import ngược lên là bug kiến trúc.
//       Chỉ áp dụng cho đích nằm trong src/+bin/ (vùng manifest quản lý) —
//       import ra ngoài (vd. scripts/, thư mục dev/ops tool riêng, chưa bao
//       giờ được quét vào manifest) không phải câu hỏi về tầng.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'docs', 'architecture-manifest.json'), 'utf8'),
);
const rank = new Map(manifest.layers.map((layer, i) => [layer, i]));

function mjsFilesUnder(dir) {
  const entries = fs.readdirSync(path.join(root, dir), {
    withFileTypes: true,
    recursive: true,
  });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.mjs'))
    .map((e) => path.relative(root, path.join(e.parentPath, e.name)));
}

const onDisk = [...mjsFilesUnder('src'), ...mjsFilesUnder('bin')].sort();
const inManifest = Object.keys(manifest.files).sort();

test('đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một', () => {
  assert.deepEqual(onDisk, inManifest);
});

test('mọi row dùng tầng đã khai trong layers', () => {
  for (const [file, layer] of Object.entries(manifest.files)) {
    assert.ok(rank.has(layer), `${file}: tầng "${layer}" không có trong layers`);
  }
});

test('import một chiều xuống: không file nào import ngược lên tầng trên', () => {
  const violations = [];
  for (const file of inManifest) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    // Bắt cả import nhiều dòng: `import {\n ... \n} from './x.mjs';`
    for (const m of source.matchAll(/^import\s[^;]*?from\s+['"](\.[^'"]+)['"]/gms)) {
      const target = path
        .relative(root, path.resolve(root, path.dirname(file), m[1]))
        .split(path.sep)
        .join('/');
      // The manifest only covers src/ + bin/ (per "đủ sổ" above) — a
      // relative import reaching outside that tree (e.g. into scripts/,
      // a separate area of standalone dev/ops tools never scanned into
      // the manifest) isn't a layering question at all, since there is no
      // layer rank to compare against. Only a target actually inside
      // src/+bin/ but missing its row is a real "forgot to register it"
      // bug this check exists to catch.
      const targetInManifestedTree = target.startsWith('src/') || target.startsWith('bin/');
      if (targetInManifestedTree && !(target in manifest.files)) {
        violations.push(`${file} → ${target}: đích không có row trong manifest`);
        continue;
      }
      if (!targetInManifestedTree) continue;
      if (rank.get(manifest.files[file]) > rank.get(manifest.files[target])) {
        violations.push(
          `${file} (${manifest.files[file]}) import ngược lên ${target} (${manifest.files[target]})`,
        );
      }
    }
  }
  assert.deepEqual(violations, []);
});
