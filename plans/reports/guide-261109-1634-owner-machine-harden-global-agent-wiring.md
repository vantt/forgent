# Hướng dẫn cho 3 máy: fgOS không còn tự ghi cấu hình agent toàn máy

Ngày: 2026-11-09. Áp dụng cho: fg-server2, fg-server, máy của owner (design-lap).
Quyết định: owner decision 80 Q2 (a), `plans/261021-1118-harden-low-layers-bottom-up/plan.md`.
Bằng chứng gốc: `plans/reports/audit-261109-1533-fgos-packaging-distribution.md` (F10).
Luật trong spec: RUL111, `docs/platform/packaging-distribution/spec.md`.

## 1. Cái gì đổi

Trước đây `fgctl init`, `fgos setup` và `fgos doctor --fix` tự ghi, không báo, không sao lưu:

- `~/.gemini/antigravity-cli/settings.json`: `toolPermission: "always-proceed"` cùng 7 luật deny, kể cả khi máy không cài agy;
- file settings người dùng của Claude (`~/.claude/settings.json`, hoặc `$CLAUDE_CONFIG_DIR/settings.json`): `crossSessionInbound: "accept"` khi project bật mailbox;
- khi có `claude`: `claude plugin marketplace add vantt/forgent` và `claude plugin install fgOS@fgos-plugins`.

Từ bản này, ba lệnh đó chỉ ghi vào project và `~/.fgos` (cộng phần cài đặt của chính fgOS: release store, launcher). Chúng không đụng tới `~/.claude`, `~/.gemini`, `~/.codex`, `~/.omp`, `~/.pi`, `~/.agents`.

Muốn nối fgOS vào cấu hình agent của mình thì dùng lệnh mới, chỉ chạy khi bạn gọi:

```sh
fgos wire-agents          # chỉ in kế hoạch: agent nào có trên máy, lệnh nào sẽ chạy, file nào sẽ đổi; không ghi gì
fgos wire-agents --yes    # sao lưu từng file đang có thành <file>.pre-wire-agents-<thời điểm>, rồi mới làm
fgos wire-agents --json   # như trên, dạng envelope JSON
```

- Nó chỉ làm với agent CLI có trên máy (`claude` trả lời `--version`, `agy` có trên PATH).
- Việc nó làm hôm nay: đăng ký marketplace `fgos-plugins` và cài plugin fgOS cho Claude Code (qua CLI `claude`).
- Nó không bao giờ ghi một quyền làm agent được làm nhiều hơn. Với agy `toolPermission: "always-proceed"` và Claude `crossSessionInbound: "accept"`, nó chỉ in file, giá trị và lý do; bạn tự quyết, tự sửa file. Spec mailbox (mục 7.2) khuyên không bật `crossSessionInbound: accept` toàn máy.

Ba dòng doctor đổi theo:

| Dòng | Trước | Bây giờ |
|---|---|---|
| `claude-plugin-marketplace` | đỏ khi thiếu, `doctor --fix` tự cài | thiếu plugin thì chỉ cảnh báo (`warning:`), nêu `fgos wire-agents`; chỉ đỏ khi `claude` không trả lời được danh sách plugin |
| `agy-permissions-configured` | đỏ khi thiếu, `--fix` tự ghi | qua khi agy không có trên PATH; có agy mà thiếu thì chỉ cảnh báo (`warning:`), không bao giờ đỏ |
| `mailbox-claude-accept` | đỏ khi thiếu, `--fix` tự ghi | qua với accept, hold hoặc mặc định; chỉ đỏ khi file không đọc được |

## 2. Trên 3 máy: không cần làm gì để giữ nguyên trạng

- Các file toàn máy đã được bản cũ ghi (`~/.gemini/antigravity-cli/settings.json`, khoá `crossSessionInbound` trong settings của Claude, plugin fgOS đã cài) **được giữ nguyên**. Bản mới không hoàn tác, không xoá, không sửa chúng.
- Vì vậy các dòng doctor trên 3 máy sẽ vẫn qua như trước: agy đã có `always-proceed` thì dòng agy qua; Claude đã `accept` thì dòng mailbox qua; plugin đã cài thì dòng plugin qua.
- Agy worker chạy dưới sub-HOME (`~/.agy-homes/...`) vẫn do dòng `agy-sub-homes-configured` kiểm như trước; dòng này chưa bao giờ có fix và không đổi.

## 3. Khi nào thay đổi có hiệu lực trên một máy

`fgos` thường chạy release đang kích hoạt, không chạy source mới sửa. Thay đổi chỉ có hiệu lực sau khi máy kích hoạt một release dựng từ main có commit này. Trước lúc đó, `fgos doctor --fix` của release cũ vẫn có thể tự ghi các file trên (với 3 máy thì không sao, vì các khoá đã có sẵn và bản cũ chỉ điền khoá còn thiếu).

Kiểm tra sau khi kích hoạt:

```sh
fgos wire-agents          # phải in "Agents found: ..." và "Nothing to change." nếu plugin đã cài
fgos doctor --json | grep -E 'claude-plugin-marketplace|agy-permissions-configured|mailbox-claude-accept'
```

## 4. Nối lại (re-wiring) khi cần

Dùng khi một máy mới, một HOME mới, hoặc bạn đã gỡ plugin và muốn cài lại:

```sh
fgos wire-agents          # đọc kế hoạch, xem từng file sẽ đổi
fgos wire-agents --yes    # làm; in "Backed up <file> -> <file>.pre-wire-agents-<thời điểm>"
```

Muốn hoàn tác một lần chạy: chép file `.pre-wire-agents-<thời điểm>` đè lại file gốc (ví dụ `cp ~/.claude/settings.json.pre-wire-agents-20261109T... ~/.claude/settings.json`).

Muốn agy worker chạy lệnh headless dưới HOME thật (không qua sub-HOME), hoặc muốn mailbox đánh thức phiên Claude đang rảnh: `fgos wire-agents` in đúng đoạn JSON cần thêm và lý do; bạn tự thêm vào file nếu đồng ý.
