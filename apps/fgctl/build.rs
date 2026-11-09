//! Embeds the build's source commit and commit date into `fgctl --version`.
//!
//! The release build states them through the environment: the full commit id
//! in `FGOS_BUILD_COMMIT` (else `GITHUB_SHA`) and the commit time as seconds
//! since the epoch in `SOURCE_DATE_EPOCH`. A build that states neither (a
//! developer's `cargo build`) reports the commit as unknown; this script never
//! runs `git`, so the build stays free of a second Git door.

fn main() {
    println!("cargo:rerun-if-env-changed=FGOS_BUILD_COMMIT");
    println!("cargo:rerun-if-env-changed=GITHUB_SHA");
    println!("cargo:rerun-if-env-changed=SOURCE_DATE_EPOCH");

    let commit = std::env::var("FGOS_BUILD_COMMIT")
        .or_else(|_| std::env::var("GITHUB_SHA"))
        .ok()
        .map(|id| id.trim().to_ascii_lowercase())
        .filter(|id| id.len() >= 12 && id.bytes().all(|b| b.is_ascii_hexdigit()))
        .map(|id| id[..12].to_string())
        .unwrap_or_default();
    let commit_date = std::env::var("SOURCE_DATE_EPOCH")
        .ok()
        .and_then(|seconds| seconds.trim().parse::<i64>().ok())
        .map(utc_date)
        .unwrap_or_default();

    println!("cargo:rustc-env=FGCTL_BUILD_COMMIT={commit}");
    println!("cargo:rustc-env=FGCTL_BUILD_COMMIT_DATE={commit_date}");
}

/// `YYYY-MM-DD` of a Unix timestamp (civil-from-days, proleptic Gregorian).
fn utc_date(epoch_seconds: i64) -> String {
    let days = epoch_seconds.div_euclid(86_400) + 719_468;
    let era = days.div_euclid(146_097);
    let day_of_era = days.rem_euclid(146_097);
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_index = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_index + 2) / 5 + 1;
    let month = if month_index < 10 {
        month_index + 3
    } else {
        month_index - 9
    };
    let year = year_of_era + era * 400 + i64::from(month <= 2);
    format!("{year:04}-{month:02}-{day:02}")
}
