#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum QueryError {
    #[error("a query needs at least one kind")]
    NoKind,
    #[error("invalid {what} '{value}': {message}")]
    Invalid {
        what: &'static str,
        value: String,
        message: String,
    },
    #[error("'{name}' is not a declared attr or measure, a join measure or a record field")]
    UnknownField { name: String },
    #[error("measure '{measure}' does not declare aggregation '{agg}'")]
    AggNotValid { measure: String, agg: String },
    #[error("parameter '{name}' was not supplied")]
    MissingParam { name: String },
}

pub(super) fn invalid(what: &'static str, value: &str, message: impl Into<String>) -> QueryError {
    QueryError::Invalid {
        what,
        value: value.to_owned(),
        message: message.into(),
    }
}
