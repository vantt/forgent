# plan.md — tsk-6arn: Cloudflare Access as auth layer 2

Mode: **high-risk**

Flag count/which applied (per `fgos-routing`'s Mode gate): **audit/security
(hard-gate)** — this item adds a whole new authentication mechanism
(JWT signature verification) to a gateway whose only other credential is
a single shared token; a bug here is a real auth bypass, not a cosmetic
defect. **existing covered behavior** — `require_token` already gates
every authenticated route and has real test coverage this change must
not weaken. A hard-gate flag alone forces `high-risk` regardless of total
count (`fgos-routing`'s own Mode gate table).

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returns gitnexus `present` (re-confirmed this session,
same posture already established across every prior item in this
cluster).

## Approach

**Chosen path** (RESEARCH.md's own findings, real evidence already
gathered):

1. Port `herdr-gateway/src/web/cf_access.rs` (595 lines, read in full)
   into `herdr-plugin/src/cf_access.rs` — the crypto/JWT-verification
   core (`CfAccessVerifier`, `verify_with_key`, the JWKS cache, and its
   own 12-test suite covering tampered signature / wrong aud|iss /
   expired / not-yet-valid / missing-claim / `alg:none` bypass / HS256
   key-confusion) copied WHOLESALE, unmodified in substance — this is a
   security-critical, already-audited implementation; writing a new one
   from scratch would be strictly worse, not better.
2. **Corrected during THIS validating pass, not guessed** (RESEARCH.md):
   dependency versions differ from the reference (`jsonwebtoken` 9→11,
   `reqwest` 0.12→0.13 with its TLS feature renamed `rustls-tls`→
   `rustls`) — the ported module's `Cargo.toml` entries use the REAL
   resolved versions/feature names, confirmed via `cargo add --dry-run`,
   never copied verbatim from the reference's own (older) `Cargo.toml`.
3. **Corrected: HTTP status on auth failure is 401, not the "404 câm"**
   framing carried in the item's own submit text (which came from the
   ORIGINAL pre-realignment D8, written for a cookie-session design that
   never shipped). The Bearer layer that DID ship (`tsk-7l9`, `tsk-4qf`)
   already deliberately chose 401 with category `validation` — cf-access
   is additive to that SAME gate, so it must fail the SAME way, not
   reintroduce a different convention for one credential type only.
4. **Integration avoids a `build_router` signature change** (29 real call
   sites counted via `grep -c`, all in this file's own test module — the
   same class of blast radius `tsk-48w`'s plan.md already reasoned
   against for a much smaller count). `cf_access: Arc<Option<
   CfAccessVerifier>>` becomes a new field ON `GatewayConfig` (already
   `Arc`-wrapped on `AppState`, already `#[derive(Clone)]`), constructed
   once inside `load_gateway_config` from two new optional
   `GatewaySection` fields (`cf_access_team_domain`, `cf_access_aud`).
   `build_router`'s own signature is untouched; only `test_config()` (the
   ONE shared helper all 29 sites call) needs its new field set.
5. `require_token` middleware: Bearer checked FIRST (unchanged path); on
   failure, if `state.config.cf_access` is `Some(verifier)` AND a
   `Cf-Access-Jwt-Assertion` header is present, verify it — success
   passes the request through, any failure (missing header, bad
   signature, wrong claims) falls through to the SAME existing 401
   response. Additive, never a replacement (D8's own "cộng dồn, không
   loại trừ lẫn nhau").
6. Partial config (exactly one of team_domain/aud set) is a NEW
   `GatewayConfigError` variant, not silently treated as "off" — a person
   who set one but not the other almost certainly meant both.

**Phương án đã cân nhắc và loại:**
- Đổi chữ ký `build_router` để nhận verifier riêng — loại, đúng lý do
  `tsk-48w` đã ghi cho trường hợp nhỏ hơn (9 site), ở đây còn nặng hơn
  (29 site).
- Giữ nguyên convention "404 câm" từ mô tả item gốc — loại, vì đó là
  framing của một thiết kế (cookie-session P2) chưa từng thực sự tồn tại
  trong code đã ship; 401 là quyết định thật đã khoá (`tsk-4qf`) cho
  chính gate này.
- Tự viết lại verify JWT từ đầu thay vì port — loại, D8 chính nó yêu cầu
  port idiom đã kiểm chứng; viết lại một cơ chế auth crypto mới không có
  12-test-suite đã có sẵn là tăng rủi ro, không giảm.

**Files chạm:** `herdr-plugin/src/cf_access.rs` (mới), `herdr-plugin/src/
gateway.rs` (thêm field `cf_access` vào `GatewayConfig`/`GatewaySection`,
2 field config mới, sửa `require_token`, cập nhật `test_config()`),
`herdr-plugin/Cargo.toml` (3 dep mới: `jsonwebtoken`, `reqwest`,
`base64`), `herdr-plugin/src/lib.rs` hoặc tương đương để export module
mới nếu cần (kiểm tại Execute).

## Risk map

| Thành phần | Mức | Chứng minh gì |
|---|---|---|
| JWT verification core đúng, không có lỗ bypass | Cao — hard-gate audit/security, đây là core của cả item | Port nguyên 12 test đã có của reference (tampered sig, wrong aud/iss, expired, not-yet-valid, missing claim, `alg:none`, HS256 key-confusion, cache behavior) — chạy thật tại Execute, không được bỏ test nào |
| Dependency version đúng, build được thật | Thấp — đã `cargo add --dry-run` thật tại validating pass này | jsonwebtoken 11.0.0, reqwest 0.13.4 (feature `rustls` đã sửa đúng), base64 0.23.1 — không xung đột |
| `require_token` không đổi hành vi của Bearer layer hiện có | Trung bình — middleware đang gate MỌI route đã có | Test thật: request có Bearer hợp lệ vẫn qua (không đụng nhánh cũ); request KHÔNG có cả Bearer lẫn cf-access vẫn 401 y hệt trước |
| `build_router`'s 29 call site không bị đụng | Thấp — đã đếm thật, thiết kế tránh đổi chữ ký | Không cần sửa gì ngoài `test_config()`; `cargo test --lib gateway` (toàn bộ, không chỉ `cf_access`) chạy lại xanh chứng minh không đụng vỡ |
| Partial config (chỉ 1 trong 2 field) báo lỗi rõ, không im lặng | Thấp | Test thật: chỉ set `cf_access_team_domain`, không set `aud` → `load_gateway_config` trả lỗi thật, không phải `None` âm thầm |

## Verify (mới, chưa từng có)

```
cd herdr-plugin && cargo test --lib
```

Toàn bộ lib test (không chỉ filter `cf_access`) — đúng tinh thần chứng
minh KHÔNG đụng vỡ 29 call site + toàn bộ `gateway`/`settings`/`mcp` test
hiện có, không chỉ module mới tự đứng được một mình.

## Decide the split

Một mảnh — không tách. Module JWT verification + wiring vào middleware +
config field đều phục vụ đúng MỘT hành vi quan sát được ("gateway chấp
nhận cf-access JWT hợp lệ làm credential thay thế khi Bearer thiếu, khi
đã cấu hình") — tách nhỏ hơn (vd module riêng không wiring) sẽ không tự
đứng được, không chứng minh được gì có ý nghĩa.

## Outstanding questions

None — RESEARCH.md đã giải hết các điểm mở (version thật, HTTP status
convention thật, blast radius thật), không còn gì cần hỏi người.
