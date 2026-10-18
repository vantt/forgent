//! Event Store protocol core. Dormant until its consumer cutover.
pub mod envelope;
pub mod errors;
pub mod identity;
pub mod layout;
pub mod legacy;
pub mod registry;
pub mod validation;

pub mod append;
pub mod fsio;
pub mod locks;
pub mod open_read;
pub mod rotate;

pub mod cursor;
pub mod order;
pub mod read;
pub mod walk;
