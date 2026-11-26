//! Rule units for fgOS: the schema (`rule`), the registry of `when:` keys (`when_keys`), composition of the rules in
//! force (`compose`), the write-time check and compile (`check`), the compiled set with its digest and its reader
//! (`set`), and the refusals (`refusal`). The pkm store (`store`, feature `store`) indexes the three rule roots and
//! answers which rules are in force; everything else builds without it, so a reader of the compiled set links no pkm.

pub mod check;
pub mod compose;
pub mod refusal;
pub mod rule;
pub mod set;
pub mod when_keys;

#[cfg(feature = "store")]
pub mod store;
