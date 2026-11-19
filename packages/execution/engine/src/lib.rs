//! `fgos-execution-engine`: Execution's effectful half.
//!
//! It owns what touches the machine on behalf of a Unit run: confinement of a worker, provider accounts and
//! their credentials, the transport that starts and watches a worker, the assignment records, the execution
//! contract, settlement, the steps of a workflow, dispatch planning and the unit run that ties them together.
//!
//! What it does not own: the pure rules stay in `fgos-execution` (what a Unit is, how an outcome is judged, which
//! executor a seat takes), and the attempt process stays in `fgos-run-supervisor`. Nothing below the engine
//! depends on it; the Node addon never links it.

pub mod confinement {
    //! Confinement: the request a worker runs under, its policy, the driver that applies it and the cleanup.
    pub mod cleanup;
    pub mod driver;
    pub mod policy;
    pub mod request;
}
pub mod accounts credentials transport transport_round run_result assignment contract settlement steps planning assignment_runner unit_run;
