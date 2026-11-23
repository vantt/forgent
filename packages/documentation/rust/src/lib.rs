//! Document identity: the locate port (`port`), its use case (`locate`), the pkm adapter that answers it (`pkm`) and
//! the profile pkm reads, rendered from the corpus (`profile`). The crate knows no fgOS layout beyond the docs tree:
//! the composition root hands it every path.

pub mod locate;
pub mod pkm;
pub mod port;
pub mod profile;
