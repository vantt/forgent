# Coding-domain Observe definitions

`definitions/` holds the driving measures as `fgos metrics query` definitions:

```sh
fgos metrics query --def domains/coding/observe/definitions
```

Each file answers one question. Rates are left to the reader: a definition gives counts per outcome, and the rate is
the non-pass (or pass) count divided by the group's total.

## Units

- `span` is in seconds: from the earliest record's start to the latest record's end.
- `fgos.duration` is in milliseconds: the run attempt's or verify command's own duration, so `sum:fgos.duration` is
  milliseconds too.
- Token measures (`fgos.usage.total_tokens`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`) are token
  counts.
