//! Panel: the unit's member seats run together, then its synthesizer. A different provider family per seat is a
//! soft preference (`preferIndependentOf`); Seat Binding owns the choice and never refuses a seat for it.

use super::role_tasks::{role_unit, RoleAsk};
use super::{
    ids_without, outcome_of, seat_id, seat_is, stepped, Command, LoopInput, LoopResult, RoleCall,
    Step,
};
use crate::outcome::is_error_outcome;
use crate::seat_resolver::value::truthy;
use crate::seat_resolver::{resolve_seats, ResolveOptions, SeatResolutionError};
use serde_json::Value;

enum State {
    Start,
    AwaitMembers(Vec<Option<Value>>),
    AwaitSynth(Vec<Value>),
    Finished,
}

pub struct Panel {
    members: Vec<Value>,
    synthesizer: Value,
    unit: Value,
    params: Value,
    history: Vec<Value>,
    state: State,
}

impl Panel {
    pub(super) fn new(input: LoopInput) -> Result<Panel, SeatResolutionError> {
        let seats = resolve_seats(&ResolveOptions {
            loop_name: Some("panel".into()),
            params: Some(input.params.clone()),
            unit: input.unit.clone(),
            runner_config: input.cfg.clone(),
            ..Default::default()
        })?;
        let members = seats
            .iter()
            .filter(|s| {
                s.get("posture")
                    .and_then(|p| p.get("stance"))
                    .is_some_and(truthy)
            })
            .cloned()
            .collect();
        let synthesizer = seats
            .iter()
            .find(|s| s.get("role").and_then(Value::as_str) == Some("synthesizer"))
            .cloned()
            .unwrap_or(Value::Null);
        Ok(Panel {
            members,
            synthesizer,
            unit: input.unit,
            params: input.params,
            history: input.history,
            state: State::Start,
        })
    }

    fn passed(&self, seat: &str) -> Option<Value> {
        self.history
            .iter()
            .find(|h| seat_is(h, seat) && outcome_of(h) == "pass")
            .cloned()
    }

    pub(super) fn step(
        &mut self,
        answers: Option<Vec<Value>>,
    ) -> Result<Step, SeatResolutionError> {
        match std::mem::replace(&mut self.state, State::Finished) {
            State::Start => {
                let ids: Vec<String> = self.members.iter().map(seat_id).collect();
                let reused: Vec<Option<Value>> = ids.iter().map(|id| self.passed(id)).collect();
                let pending = reused.iter().filter(|r| r.is_none()).count();
                // Every pending member binds in the listed order and none launches before all are bound.
                let commands: Vec<Command> = self
                    .members
                    .iter()
                    .zip(&reused)
                    .filter(|(_, r)| r.is_none())
                    .map(|(member, _)| {
                        let id = seat_id(member);
                        let ask = RoleAsk::new(&id, &self.params).kind("panelist").stance();
                        let mut call = RoleCall::new(member, role_unit(&self.unit, &ask));
                        call.prefer_independent_of = Some(ids_without(&ids, &id));
                        call.batch = Some(pending);
                        Command::Role(Box::new(call))
                    })
                    .collect();
                if commands.is_empty() {
                    let results = reused.into_iter().flatten().collect();
                    return self.after_members(results);
                }
                self.state = State::AwaitMembers(reused);
                Ok(Step::Dispatch(commands))
            }
            State::AwaitMembers(reused) => {
                let mut answered =
                    stepped(answers, reused.iter().filter(|r| r.is_none()).count())?.into_iter();
                let results = reused
                    .into_iter()
                    .map(|r| r.or_else(|| answered.next()).unwrap_or(Value::Null))
                    .collect();
                self.after_members(results)
            }
            State::AwaitSynth(members) => {
                let synth = stepped(answers, 1)?.remove(0);
                Ok(self.finish(members, synth))
            }
            State::Finished => Err(SeatResolutionError::new(
                "the loop already ended",
                "loop-ended",
            )),
        }
    }

    fn after_members(&mut self, members: Vec<Value>) -> Result<Step, SeatResolutionError> {
        if let Some(error) = members.iter().find(|r| is_error_outcome(outcome_of(r))) {
            return Ok(Step::Done(LoopResult {
                outcome: outcome_of(error).to_string(),
                rounds: None,
                results: members.clone(),
                findings: None,
            }));
        }
        let synth_id = seat_id(&self.synthesizer);
        if let Some(existing) = self.passed(&synth_id) {
            return Ok(self.finish(members, existing));
        }
        let ids: Vec<String> = self.members.iter().map(seat_id).collect();
        // The members answer the unit's objective; the synthesizer is told to synthesize their answers, and it
        // prefers a provider family none of them used.
        let ask = RoleAsk::new(&synth_id, &self.params).kind("synthesizer");
        let mut call = RoleCall::new(&self.synthesizer, role_unit(&self.unit, &ask));
        call.prefer_independent_of = Some(ids);
        call.inputs = Some(members.clone());
        self.state = State::AwaitSynth(members);
        Ok(Step::Dispatch(vec![Command::Role(Box::new(call))]))
    }

    fn finish(&mut self, mut members: Vec<Value>, synth: Value) -> Step {
        self.state = State::Finished;
        let outcome = outcome_of(&synth).to_string();
        members.push(synth);
        Step::Done(LoopResult {
            outcome,
            rounds: None,
            results: members,
            findings: None,
        })
    }
}
