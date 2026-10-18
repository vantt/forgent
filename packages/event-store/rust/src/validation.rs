//! Shared protocol identifier grammar.
pub fn lowercase_hex(value: &str, length: usize) -> bool {
    value.len() == length
        && value
            .bytes()
            .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
}
pub fn valid_store_id(value: &str) -> bool {
    lowercase_hex(value, 32)
}
pub fn valid_object_id(value: &str) -> bool {
    lowercase_hex(value, 40) || lowercase_hex(value, 64)
}
