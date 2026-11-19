//! The case admission's consent, checked again just before a writing round commits.

use fgos_execution::admission::{CaseAdmission, Recheck};

/// The admission a run holds: its port, the case and the reservation it took.
pub struct HeldAdmission<'a, P: CaseAdmission> {
    pub port: &'a P,
    pub case_id: &'a str,
    pub reservation_id: &'a str,
}

/// A refused consent: the commit does not happen.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConsentRefusal {
    pub reason: String,
    pub detail: String,
}

/// `Ok(None)` when there is no admission or the consent holds; `Ok(Some(_))` refuses the commit. A port that
/// cannot answer is `Err`: the run fails closed, nothing is committed.
pub fn recheck_write_consent<P: CaseAdmission>(
    admission: Option<&HeldAdmission<'_, P>>,
    changed_files: &[String],
) -> Result<Option<ConsentRefusal>, P::Error> {
    let Some(held) = admission else { return Ok(None) };
    Ok(
        match held
            .port
            .recheck_effect(held.reservation_id, held.case_id, changed_files)?
        {
            Recheck::Ok => None,
            Recheck::Refused { code, condition } => Some(ConsentRefusal {
                reason: code,
                detail: condition,
            }),
        },
    )
}
