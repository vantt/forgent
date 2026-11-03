# Thi công cửa vào của cook (`fgos workflow propose`)

Thiết kế: [design.md](design.md). Owner đã duyệt cách B và bảng loại mảnh (hợp đồng và nền tảng = `high`) ngày 2026-11-03. Kế hoạch này chỉ là thứ tự làm; không mở thêm phạm vi.

## Khung chạy

Mỗi bước là một vòng cook riêng: một seat ghi, một checker độc lập (ưu tiên `[xai, openai]`), sau đó `npm test` đầy đủ do em chạy. Các bước 1 và 2 ghi vào file khác nhau nên chạy song song; 3, 4, 5 chạy lần lượt vì chung file.

## Các bước

1. **Hàm tính khung** (`src/workflow/propose-frame.mjs`, hàm thuần) và phép chạy lại quá khứ. Vào: danh sách mảnh (đã có loại và rigor), có kế thừa được hay không, bảng pattern. Ra: `dispatches`, `mutatingDispatches`, `seatLaunchesPerDispatch`, `rigorFloor`, `fallbackPerSeat`. Test: các vòng thật của Part A (22/22, 24/14, 8/4, 6/2, 6/2, 9/4, 7/3), khung đề xuất không nhỏ hơn mức đã dùng và không quá 1,5 lần; nếu một vòng không dựng lại được từ bằng chứng thì ghi rõ vòng đó và vì sao, không bịa.
2. **Bảng loại mảnh và bộ phân loại.** Bảng là dữ liệu có phiên bản ở `domains/coding/` (đường ghi → loại, capability, pattern, rigor; nhiều mẫu khớp thì rigor cao nhất thắng; mảnh không đảo được trả về "hỏi owner trước"). Bộ phân loại ở `src/workflow/propose-classify.mjs`. Mỗi quy tắc một test, có đối chứng: mảnh chạm hợp đồng khóa không bao giờ ra rigor thấp. Agent được nâng rigor kèm lý do, không bao giờ hạ dưới bảng.
3. **Kiểm tra với thực tế** (`src/workflow/propose-validate.mjs`): đường ghi tồn tại hoặc là file mới hợp lệ; hai mảnh không ghi chồng; mở rộng sang test chạm ký hiệu đổi (bằng `rg`, kiểm được); capability có trong catalog; rigor không dưới sàn khung. Từ chối có mã lỗi, không sửa ngầm.
4. **Lệnh `fgos workflow propose`** (`src/workflow/propose.mjs`, đăng ký ở `bin/fgos.mjs` và `src/cli/command-registry.mjs`): nhận bản kê mảnh, ra (a) JSON đề xuất, (b) câu hỏi quyết định năm phần bằng tiếng Việt, (c) chuỗi lệnh `workflow start`, `fgos run …`, `workflow gate`. Tìm case đã đóng cùng plan và commit gốc thì đề xuất `--inherit`. Yêu cầu tự do không có plan: phân loại một việc nhỏ / vài mảnh / cần `shape-plan` trước, ngưỡng nằm trong bảng dữ liệu. Test đầu cuối trên guide thật: các lệnh sinh ra chạy được nguyên văn.
5. **Sửa skill `fgos-cook`** (`core/skills/fgos-cook/`, rồi `npm run build:skills` cho các bản render): gọi `propose` thay cho việc tính khung bằng lời; bảng cỡ khung trong `references/reading-ak-plans.md` thay bằng liên kết tới hàm; xóa `route-table-pending.md` vì điều kiện chờ đã hết.

## Ràng buộc chung

- Một cửa, không tính khung ở hai nơi. Không agent hay mã nào quyết provider, model, tier.
- Không chạm `/docs` ngoài một dòng `docs/architecture-manifest.json` nếu guard kiến trúc đòi; báo trên board nếu có.
- Mỗi lần đổi hành vi người dùng thấy: một dòng `CHANGELOG.md`. Census Git: `node scripts/git-one-door-scan.mjs --write-census` rồi `--check`.
- Không ghi mã kế hoạch hay mã phát hiện vào comment, tên test, commit.
- Cargo (nếu cần) tuần tự `-j 4`, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/.cargo-target-cook`.

## Điều kiện đảo

- Nếu phép chạy lại quá khứ lệch quá 1,5 lần ở nhiều vòng, sửa bảng dữ liệu, không sửa phép tính.
- Nếu năm đề xuất duyệt liên tiếp không phải sửa số nào, mở thiết kế riêng cho chế độ tự chạy.
