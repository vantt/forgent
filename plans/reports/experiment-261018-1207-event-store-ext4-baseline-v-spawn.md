# Event Store ext4 whole-CLI baseline

Baseline of record for spec §17(b): **host**, the standard PATH `fgos` shim and activated Rust host. Measured 2026-10-18 12:09–12:10 Asia/Saigon; 40 samples per mutation/concurrency row, ext4 on `/dev/nvme0n1p2`, Intel i7-13700 (24 logical CPUs), Node v24.22.0. All 360 measured mutations and 120 settle-preparation claims succeeded.

Harness checkout: `735b13dcfd291b52d1cd08497b7251468831c427` with this unit's harness edits, containing `a4b1278ae`. Activated release: `sha256:f88afb1769b78b06f3b4c4d7c6bf8b1ec4bcc848ced5828453f546dc4eb60374`. The release's manifest declares `components.legacyNode.root=libexec/legacy-node`, entry `bin/fgos.mjs`. All 2 checkout `bin/` files and 285 `src/` files were compared byte for byte with that payload: zero differences. No Event Store cutover exists. Rust host freshness is identified by the release digest, not inferred from checkout HEAD.

The harness seeds a fresh real Git project via the production consumer API. Timings cover spawn through exit for `take`, CAS `move todo→blocked`, and `return --to blocked`; each return's preparation claim uses the same writer and is outside measured latency. Rows run sequentially, concurrency within each row is 1/10/20. Source-tree fixture and output paths are refused except under `.fgos/runtime/`, including symlink resolution. Raw observations are embedded below rather than committed among scripts.

| Mutation | Sessions | n | p50 ms | p95 ms | p99/max ms | Errors |
|---|---:|---:|---:|---:|---:|---:|
| claim | 1 | 40 | 292.09 | 318.25 | 345.89 | 0 |
| claim | 10 | 40 | 291.48 | 392.98 | 408.08 | 0 |
| claim | 20 | 40 | 394.37 | 591.49 | 618.31 | 0 |
| move | 1 | 40 | 206.88 | 236.12 | 246.39 | 0 |
| move | 10 | 40 | 226.38 | 269.10 | 283.17 | 0 |
| move | 20 | 40 | 320.15 | 400.42 | 411.14 | 0 |
| settle | 1 | 40 | 186.93 | 269.37 | 281.48 | 0 |
| settle | 10 | 40 | 255.40 | 311.38 | 313.52 | 0 |
| settle | 20 | 40 | 396.89 | 524.96 | 564.07 | 0 |

Reproduce from a checkout on ext4, with the parent directory already present and the fixture absent:

```sh
mkdir -p .fgos/runtime/tmp/v-spawn-ext4
node scripts/event-store/v-spawn-bench.mjs --entry host \
  --root .fgos/runtime/tmp/v-spawn-ext4/fixture \
  --out .fgos/runtime/tmp/v-spawn-ext4/results.json
```

`--entry node-payload` selects the historical compatibility measurement. Both entry modes now record `entry`, command description and resolved activated host path. V-SPAWN-01 used the Node payload with `FGOS_HOST_BIN` (its report's method and strace command), as did unit 2. Those two payload runs can be compared by entry; they cannot be silently compared with this host baseline. Future acceptance must use `host` for comparison with the baseline of record here. This run's actual fixture/output live in `.fgos/runtime/tmp/es-u3-baseline/`.

Limits: no warmup; claims and state history accumulate across rows; direct-child peak includes settle preparation and is not a descendant-spawn count; HOME/global config are inherited, though the native state root and session ids are private. `findmnt` requires Linux. This is whole-CLI wall time, not in-gate increment, fsync-only cost, causal attribution or lock-wait measurement. The 50 ms native in-gate budget remains untested. Performance comparisons must preserve entry, release provenance, row order and fixture history. The prior unit-2 reproduce block pointing into `scripts/` is superseded by this command; that report is outside this unit's write scope.

Path was queried with `fgos convention path --kind report --type experiment --slug event-store-ext4-baseline-v-spawn --json`, which returned this exact path. The JSON blocks retain original absolute paths for provenance, not instructions to recreate fixtures there.

## Raw host baseline (record)

```json
{
  "contract": "v-spawn-benchmark.v1",
  "entry": "host",
  "command": "fgos (PATH shim, activated release)",
  "generatedAt": "2026-10-18T05:09:24.923Z",
  "checkout": "/home/vantt/projects/forgent/.claude/worktrees/es-p01",
  "commit": "735b13dcfd291b52d1cd08497b7251468831c427",
  "containsReadClaimsFix": true,
  "filesystem": "ext4",
  "mount": "/dev/nvme0n1p2[/home/vantt/projects/forgent/.claude/worktrees/es-p01] ext4",
  "root": "/home/vantt/projects/forgent/.claude/worktrees/es-p01/.fgos/runtime/tmp/es-u3-baseline/fixture",
  "hostBin": "/home/vantt/.local/state/fgos/releases/sha256:f88afb1769b78b06f3b4c4d7c6bf8b1ec4bcc848ced5828453f546dc4eb60374/bin/fgos",
  "node": "v24.22.0",
  "cpu": "13th Gen Intel(R) Core(TM) i7-13700",
  "logicalCpus": 24,
  "samples": 40,
  "sessions": [
    1,
    10,
    20
  ],
  "rows": [
    {
      "mutation": "claim",
      "sessions": 1,
      "n": 40,
      "errors": [],
      "p50": 292.0888789999999,
      "p95": 318.25400100000024,
      "p99": 345.8857819999994,
      "max": 345.8857819999994,
      "peakDirectChildren": 1,
      "observations": [
        {
          "ms": 208.40861099999998,
          "code": 0
        },
        {
          "ms": 270.59375100000005,
          "code": 0
        },
        {
          "ms": 293.519186,
          "code": 0
        },
        {
          "ms": 259.0975229999999,
          "code": 0
        },
        {
          "ms": 194.665978,
          "code": 0
        },
        {
          "ms": 214.000814,
          "code": 0
        },
        {
          "ms": 288.2468429999999,
          "code": 0
        },
        {
          "ms": 297.1032210000001,
          "code": 0
        },
        {
          "ms": 278.8258100000003,
          "code": 0
        },
        {
          "ms": 280.33354099999997,
          "code": 0
        },
        {
          "ms": 302.54742000000033,
          "code": 0
        },
        {
          "ms": 268.613914,
          "code": 0
        },
        {
          "ms": 258.5943120000002,
          "code": 0
        },
        {
          "ms": 283.80401900000015,
          "code": 0
        },
        {
          "ms": 285.86577099999977,
          "code": 0
        },
        {
          "ms": 318.25400100000024,
          "code": 0
        },
        {
          "ms": 300.78716799999984,
          "code": 0
        },
        {
          "ms": 307.16053699999975,
          "code": 0
        },
        {
          "ms": 303.1547419999997,
          "code": 0
        },
        {
          "ms": 300.98379300000033,
          "code": 0
        },
        {
          "ms": 305.26564899999994,
          "code": 0
        },
        {
          "ms": 292.0888789999999,
          "code": 0
        },
        {
          "ms": 296.18746199999987,
          "code": 0
        },
        {
          "ms": 279.4414289999995,
          "code": 0
        },
        {
          "ms": 299.34253100000024,
          "code": 0
        },
        {
          "ms": 295.2269150000002,
          "code": 0
        },
        {
          "ms": 282.92916499999956,
          "code": 0
        },
        {
          "ms": 320.2748470000006,
          "code": 0
        },
        {
          "ms": 292.0830500000002,
          "code": 0
        },
        {
          "ms": 303.89340300000003,
          "code": 0
        },
        {
          "ms": 273.33903699999973,
          "code": 0
        },
        {
          "ms": 239.78323699999964,
          "code": 0
        },
        {
          "ms": 291.73071900000105,
          "code": 0
        },
        {
          "ms": 294.70084900000074,
          "code": 0
        },
        {
          "ms": 298.4913550000001,
          "code": 0
        },
        {
          "ms": 291.6298999999999,
          "code": 0
        },
        {
          "ms": 294.41970599999877,
          "code": 0
        },
        {
          "ms": 345.8857819999994,
          "code": 0
        },
        {
          "ms": 299.98530500000015,
          "code": 0
        },
        {
          "ms": 302.1824460000007,
          "code": 0
        }
      ]
    },
    {
      "mutation": "claim",
      "sessions": 10,
      "n": 40,
      "errors": [],
      "p50": 291.48099300000104,
      "p95": 392.9848170000005,
      "p99": 408.08221500000036,
      "max": 408.08221500000036,
      "peakDirectChildren": 10,
      "observations": [
        {
          "ms": 238.40149199999905,
          "code": 0
        },
        {
          "ms": 291.48099300000104,
          "code": 0
        },
        {
          "ms": 215.2033449999999,
          "code": 0
        },
        {
          "ms": 224.816017000001,
          "code": 0
        },
        {
          "ms": 209.8380049999996,
          "code": 0
        },
        {
          "ms": 330.6316860000006,
          "code": 0
        },
        {
          "ms": 312.96863699999994,
          "code": 0
        },
        {
          "ms": 253.93708700000025,
          "code": 0
        },
        {
          "ms": 260.7076649999999,
          "code": 0
        },
        {
          "ms": 292.86519899999985,
          "code": 0
        },
        {
          "ms": 408.08221500000036,
          "code": 0
        },
        {
          "ms": 284.0501400000012,
          "code": 0
        },
        {
          "ms": 331.8603129999992,
          "code": 0
        },
        {
          "ms": 339.19913799999995,
          "code": 0
        },
        {
          "ms": 306.4885919999997,
          "code": 0
        },
        {
          "ms": 256.41125600000123,
          "code": 0
        },
        {
          "ms": 287.92943000000014,
          "code": 0
        },
        {
          "ms": 309.8946189999988,
          "code": 0
        },
        {
          "ms": 265.7187620000004,
          "code": 0
        },
        {
          "ms": 375.2421740000009,
          "code": 0
        },
        {
          "ms": 284.16510599999856,
          "code": 0
        },
        {
          "ms": 278.0687740000012,
          "code": 0
        },
        {
          "ms": 318.476286000001,
          "code": 0
        },
        {
          "ms": 329.4760670000014,
          "code": 0
        },
        {
          "ms": 392.9848170000005,
          "code": 0
        },
        {
          "ms": 404.97920799999883,
          "code": 0
        },
        {
          "ms": 281.70490099999915,
          "code": 0
        },
        {
          "ms": 294.24601399999847,
          "code": 0
        },
        {
          "ms": 330.20325500000035,
          "code": 0
        },
        {
          "ms": 337.20452599999953,
          "code": 0
        },
        {
          "ms": 357.5533809999997,
          "code": 0
        },
        {
          "ms": 315.80043600000135,
          "code": 0
        },
        {
          "ms": 274.1922119999999,
          "code": 0
        },
        {
          "ms": 386.0833509999993,
          "code": 0
        },
        {
          "ms": 243.01935700000104,
          "code": 0
        },
        {
          "ms": 227.33316600000035,
          "code": 0
        },
        {
          "ms": 300.6752299999989,
          "code": 0
        },
        {
          "ms": 256.8996729999999,
          "code": 0
        },
        {
          "ms": 285.22279999999955,
          "code": 0
        },
        {
          "ms": 241.37893799999983,
          "code": 0
        }
      ]
    },
    {
      "mutation": "claim",
      "sessions": 20,
      "n": 40,
      "errors": [],
      "p50": 394.3729860000003,
      "p95": 591.4888249999985,
      "p99": 618.3072379999994,
      "max": 618.3072379999994,
      "peakDirectChildren": 20,
      "observations": [
        {
          "ms": 436.0522799999999,
          "code": 0
        },
        {
          "ms": 296.9285299999992,
          "code": 0
        },
        {
          "ms": 467.1143140000004,
          "code": 0
        },
        {
          "ms": 287.42731000000094,
          "code": 0
        },
        {
          "ms": 268.77892000000065,
          "code": 0
        },
        {
          "ms": 387.69522700000016,
          "code": 0
        },
        {
          "ms": 474.9402339999997,
          "code": 0
        },
        {
          "ms": 345.17871599999853,
          "code": 0
        },
        {
          "ms": 304.044444000001,
          "code": 0
        },
        {
          "ms": 272.62375299999985,
          "code": 0
        },
        {
          "ms": 412.9337630000009,
          "code": 0
        },
        {
          "ms": 507.90967699999965,
          "code": 0
        },
        {
          "ms": 490.60994799999935,
          "code": 0
        },
        {
          "ms": 454.8648260000009,
          "code": 0
        },
        {
          "ms": 440.0559549999998,
          "code": 0
        },
        {
          "ms": 375.58758000000125,
          "code": 0
        },
        {
          "ms": 394.774073999999,
          "code": 0
        },
        {
          "ms": 320.6202310000008,
          "code": 0
        },
        {
          "ms": 356.1683059999996,
          "code": 0
        },
        {
          "ms": 342.9040729999997,
          "code": 0
        },
        {
          "ms": 332.7913320000007,
          "code": 0
        },
        {
          "ms": 407.38544,
          "code": 0
        },
        {
          "ms": 394.3729860000003,
          "code": 0
        },
        {
          "ms": 428.70452300000034,
          "code": 0
        },
        {
          "ms": 462.07616099999905,
          "code": 0
        },
        {
          "ms": 578.0273890000008,
          "code": 0
        },
        {
          "ms": 340.7076640000014,
          "code": 0
        },
        {
          "ms": 374.91925999999876,
          "code": 0
        },
        {
          "ms": 386.99640700000054,
          "code": 0
        },
        {
          "ms": 591.4888249999985,
          "code": 0
        },
        {
          "ms": 299.5582489999997,
          "code": 0
        },
        {
          "ms": 443.1569989999989,
          "code": 0
        },
        {
          "ms": 559.5132700000013,
          "code": 0
        },
        {
          "ms": 351.6977790000001,
          "code": 0
        },
        {
          "ms": 333.19335599999977,
          "code": 0
        },
        {
          "ms": 403.5853050000005,
          "code": 0
        },
        {
          "ms": 593.8691479999998,
          "code": 0
        },
        {
          "ms": 463.93018400000074,
          "code": 0
        },
        {
          "ms": 618.3072379999994,
          "code": 0
        },
        {
          "ms": 292.46370600000046,
          "code": 0
        }
      ]
    },
    {
      "mutation": "move",
      "sessions": 1,
      "n": 40,
      "errors": [],
      "p50": 206.8839939999998,
      "p95": 236.11914400000023,
      "p99": 246.39136599999983,
      "max": 246.39136599999983,
      "peakDirectChildren": 1,
      "observations": [
        {
          "ms": 187.88419900000008,
          "code": 0
        },
        {
          "ms": 190.78782500000125,
          "code": 0
        },
        {
          "ms": 205.9690389999996,
          "code": 0
        },
        {
          "ms": 194.19142499999907,
          "code": 0
        },
        {
          "ms": 219.04052799999954,
          "code": 0
        },
        {
          "ms": 209.83449800000017,
          "code": 0
        },
        {
          "ms": 174.6115979999995,
          "code": 0
        },
        {
          "ms": 198.73288499999944,
          "code": 0
        },
        {
          "ms": 215.66212000000087,
          "code": 0
        },
        {
          "ms": 214.18831399999908,
          "code": 0
        },
        {
          "ms": 246.39136599999983,
          "code": 0
        },
        {
          "ms": 235.8898040000022,
          "code": 0
        },
        {
          "ms": 195.40321400000175,
          "code": 0
        },
        {
          "ms": 208.2154840000003,
          "code": 0
        },
        {
          "ms": 185.17178199999762,
          "code": 0
        },
        {
          "ms": 238.70878900000025,
          "code": 0
        },
        {
          "ms": 227.5421979999992,
          "code": 0
        },
        {
          "ms": 222.1693410000007,
          "code": 0
        },
        {
          "ms": 206.09949799999958,
          "code": 0
        },
        {
          "ms": 236.11914400000023,
          "code": 0
        },
        {
          "ms": 158.10961400000087,
          "code": 0
        },
        {
          "ms": 216.24556699999812,
          "code": 0
        },
        {
          "ms": 207.29535600000236,
          "code": 0
        },
        {
          "ms": 220.95190899999943,
          "code": 0
        },
        {
          "ms": 214.6231250000019,
          "code": 0
        },
        {
          "ms": 190.15246399999887,
          "code": 0
        },
        {
          "ms": 161.54881000000023,
          "code": 0
        },
        {
          "ms": 165.84782700000142,
          "code": 0
        },
        {
          "ms": 194.16673499999888,
          "code": 0
        },
        {
          "ms": 162.18317199999728,
          "code": 0
        },
        {
          "ms": 181.5592719999986,
          "code": 0
        },
        {
          "ms": 217.10401300000012,
          "code": 0
        },
        {
          "ms": 185.36087000000043,
          "code": 0
        },
        {
          "ms": 212.71864300000016,
          "code": 0
        },
        {
          "ms": 208.16816800000015,
          "code": 0
        },
        {
          "ms": 206.8839939999998,
          "code": 0
        },
        {
          "ms": 194.4795559999984,
          "code": 0
        },
        {
          "ms": 198.85407900000064,
          "code": 0
        },
        {
          "ms": 218.3176480000002,
          "code": 0
        },
        {
          "ms": 215.4476309999991,
          "code": 0
        }
      ]
    },
    {
      "mutation": "move",
      "sessions": 10,
      "n": 40,
      "errors": [],
      "p50": 226.38080700000137,
      "p95": 269.10148499999923,
      "p99": 283.16746500000227,
      "max": 283.16746500000227,
      "peakDirectChildren": 10,
      "observations": [
        {
          "ms": 249.81887800000186,
          "code": 0
        },
        {
          "ms": 218.95515800000067,
          "code": 0
        },
        {
          "ms": 195.76237000000037,
          "code": 0
        },
        {
          "ms": 188.7982809999994,
          "code": 0
        },
        {
          "ms": 170.85946899999908,
          "code": 0
        },
        {
          "ms": 255.42670100000032,
          "code": 0
        },
        {
          "ms": 177.11669900000197,
          "code": 0
        },
        {
          "ms": 203.07717199999752,
          "code": 0
        },
        {
          "ms": 228.70531899999696,
          "code": 0
        },
        {
          "ms": 218.6157409999978,
          "code": 0
        },
        {
          "ms": 221.1455160000005,
          "code": 0
        },
        {
          "ms": 225.05759300000136,
          "code": 0
        },
        {
          "ms": 214.76056700000117,
          "code": 0
        },
        {
          "ms": 230.99548499999946,
          "code": 0
        },
        {
          "ms": 244.27673800000048,
          "code": 0
        },
        {
          "ms": 269.10148499999923,
          "code": 0
        },
        {
          "ms": 234.78175700000065,
          "code": 0
        },
        {
          "ms": 273.1069119999993,
          "code": 0
        },
        {
          "ms": 254.0316899999998,
          "code": 0
        },
        {
          "ms": 256.69144400000005,
          "code": 0
        },
        {
          "ms": 215.33765400000266,
          "code": 0
        },
        {
          "ms": 192.4126520000027,
          "code": 0
        },
        {
          "ms": 226.73626800000056,
          "code": 0
        },
        {
          "ms": 208.51918899999873,
          "code": 0
        },
        {
          "ms": 239.30149399999937,
          "code": 0
        },
        {
          "ms": 259.88165500000105,
          "code": 0
        },
        {
          "ms": 200.89023100000122,
          "code": 0
        },
        {
          "ms": 245.1346620000004,
          "code": 0
        },
        {
          "ms": 226.38080700000137,
          "code": 0
        },
        {
          "ms": 231.45499799999743,
          "code": 0
        },
        {
          "ms": 219.23271399999794,
          "code": 0
        },
        {
          "ms": 283.16746500000227,
          "code": 0
        },
        {
          "ms": 208.78911999999764,
          "code": 0
        },
        {
          "ms": 237.2646480000003,
          "code": 0
        },
        {
          "ms": 261.8046570000006,
          "code": 0
        },
        {
          "ms": 225.38351399999738,
          "code": 0
        },
        {
          "ms": 185.55787399999826,
          "code": 0
        },
        {
          "ms": 247.09077400000024,
          "code": 0
        },
        {
          "ms": 191.6419679999999,
          "code": 0
        },
        {
          "ms": 268.90034800000285,
          "code": 0
        }
      ]
    },
    {
      "mutation": "move",
      "sessions": 20,
      "n": 40,
      "errors": [],
      "p50": 320.1461620000009,
      "p95": 400.41965399999754,
      "p99": 411.1410990000004,
      "max": 411.1410990000004,
      "peakDirectChildren": 20,
      "observations": [
        {
          "ms": 301.34188599999834,
          "code": 0
        },
        {
          "ms": 285.9150860000009,
          "code": 0
        },
        {
          "ms": 246.49457699999766,
          "code": 0
        },
        {
          "ms": 389.62023899999986,
          "code": 0
        },
        {
          "ms": 269.9141549999986,
          "code": 0
        },
        {
          "ms": 253.20594600000186,
          "code": 0
        },
        {
          "ms": 400.41965399999754,
          "code": 0
        },
        {
          "ms": 273.93076999999903,
          "code": 0
        },
        {
          "ms": 343.5087789999998,
          "code": 0
        },
        {
          "ms": 319.9798520000004,
          "code": 0
        },
        {
          "ms": 288.5122969999975,
          "code": 0
        },
        {
          "ms": 362.6474679999992,
          "code": 0
        },
        {
          "ms": 411.1410990000004,
          "code": 0
        },
        {
          "ms": 320.8594499999999,
          "code": 0
        },
        {
          "ms": 258.04844100000264,
          "code": 0
        },
        {
          "ms": 376.3339500000002,
          "code": 0
        },
        {
          "ms": 351.44164100000125,
          "code": 0
        },
        {
          "ms": 296.2761900000005,
          "code": 0
        },
        {
          "ms": 302.6860760000018,
          "code": 0
        },
        {
          "ms": 325.1343339999985,
          "code": 0
        },
        {
          "ms": 340.8586429999996,
          "code": 0
        },
        {
          "ms": 314.99927000000025,
          "code": 0
        },
        {
          "ms": 384.70225800000117,
          "code": 0
        },
        {
          "ms": 357.2386860000006,
          "code": 0
        },
        {
          "ms": 291.34071100000074,
          "code": 0
        },
        {
          "ms": 227.48073400000067,
          "code": 0
        },
        {
          "ms": 323.4446530000023,
          "code": 0
        },
        {
          "ms": 316.8445270000011,
          "code": 0
        },
        {
          "ms": 367.5522439999986,
          "code": 0
        },
        {
          "ms": 406.71248299999934,
          "code": 0
        },
        {
          "ms": 397.78489900000204,
          "code": 0
        },
        {
          "ms": 303.0930359999984,
          "code": 0
        },
        {
          "ms": 291.0202339999996,
          "code": 0
        },
        {
          "ms": 339.16959000000134,
          "code": 0
        },
        {
          "ms": 368.1669890000012,
          "code": 0
        },
        {
          "ms": 353.1993970000003,
          "code": 0
        },
        {
          "ms": 274.90079999999944,
          "code": 0
        },
        {
          "ms": 341.01415700000143,
          "code": 0
        },
        {
          "ms": 289.72350200000074,
          "code": 0
        },
        {
          "ms": 320.1461620000009,
          "code": 0
        }
      ]
    },
    {
      "mutation": "settle",
      "sessions": 1,
      "n": 40,
      "errors": [],
      "p50": 186.93355999999767,
      "p95": 269.3716339999992,
      "p99": 281.4777900000008,
      "max": 281.4777900000008,
      "peakDirectChildren": 1,
      "observations": [
        {
          "ms": 221.66440400000283,
          "code": 0
        },
        {
          "ms": 241.5700050000014,
          "code": 0
        },
        {
          "ms": 269.3716339999992,
          "code": 0
        },
        {
          "ms": 234.35108299999774,
          "code": 0
        },
        {
          "ms": 281.4777900000008,
          "code": 0
        },
        {
          "ms": 242.82733799999914,
          "code": 0
        },
        {
          "ms": 255.82771600000342,
          "code": 0
        },
        {
          "ms": 180.8162080000002,
          "code": 0
        },
        {
          "ms": 258.098915999999,
          "code": 0
        },
        {
          "ms": 235.62901899999997,
          "code": 0
        },
        {
          "ms": 209.59807399999772,
          "code": 0
        },
        {
          "ms": 225.65964900000108,
          "code": 0
        },
        {
          "ms": 227.2430650000024,
          "code": 0
        },
        {
          "ms": 250.72328600000037,
          "code": 0
        },
        {
          "ms": 275.5538790000064,
          "code": 0
        },
        {
          "ms": 187.11428200000228,
          "code": 0
        },
        {
          "ms": 183.62723499999993,
          "code": 0
        },
        {
          "ms": 184.0266830000037,
          "code": 0
        },
        {
          "ms": 181.6162439999971,
          "code": 0
        },
        {
          "ms": 178.24391699999978,
          "code": 0
        },
        {
          "ms": 182.3496959999975,
          "code": 0
        },
        {
          "ms": 182.19842900000367,
          "code": 0
        },
        {
          "ms": 182.87976899999921,
          "code": 0
        },
        {
          "ms": 193.10949699999765,
          "code": 0
        },
        {
          "ms": 186.9134189999968,
          "code": 0
        },
        {
          "ms": 184.46069700000226,
          "code": 0
        },
        {
          "ms": 187.05487300000095,
          "code": 0
        },
        {
          "ms": 184.86958099999902,
          "code": 0
        },
        {
          "ms": 186.16639399999985,
          "code": 0
        },
        {
          "ms": 189.61171199999808,
          "code": 0
        },
        {
          "ms": 185.79263200000423,
          "code": 0
        },
        {
          "ms": 182.70394999999553,
          "code": 0
        },
        {
          "ms": 175.6053580000007,
          "code": 0
        },
        {
          "ms": 182.24859899999865,
          "code": 0
        },
        {
          "ms": 188.62224199999764,
          "code": 0
        },
        {
          "ms": 184.1879770000014,
          "code": 0
        },
        {
          "ms": 183.98738699999376,
          "code": 0
        },
        {
          "ms": 183.26282199999696,
          "code": 0
        },
        {
          "ms": 187.14611499999592,
          "code": 0
        },
        {
          "ms": 186.93355999999767,
          "code": 0
        }
      ]
    },
    {
      "mutation": "settle",
      "sessions": 10,
      "n": 40,
      "errors": [],
      "p50": 255.4042049999989,
      "p95": 311.38154999999824,
      "p99": 313.51547500000015,
      "max": 313.51547500000015,
      "peakDirectChildren": 10,
      "observations": [
        {
          "ms": 210.97795400000177,
          "code": 0
        },
        {
          "ms": 296.3174549999967,
          "code": 0
        },
        {
          "ms": 234.79607000000397,
          "code": 0
        },
        {
          "ms": 283.1141370000041,
          "code": 0
        },
        {
          "ms": 313.51547500000015,
          "code": 0
        },
        {
          "ms": 255.4042049999989,
          "code": 0
        },
        {
          "ms": 199.06345699999656,
          "code": 0
        },
        {
          "ms": 242.53058299999975,
          "code": 0
        },
        {
          "ms": 265.42010799999844,
          "code": 0
        },
        {
          "ms": 216.54422200000408,
          "code": 0
        },
        {
          "ms": 247.59990999999718,
          "code": 0
        },
        {
          "ms": 253.8272949999955,
          "code": 0
        },
        {
          "ms": 238.67814199999702,
          "code": 0
        },
        {
          "ms": 222.75836800000252,
          "code": 0
        },
        {
          "ms": 297.95453799999814,
          "code": 0
        },
        {
          "ms": 308.61792199999763,
          "code": 0
        },
        {
          "ms": 210.95522500000516,
          "code": 0
        },
        {
          "ms": 265.4245970000047,
          "code": 0
        },
        {
          "ms": 187.55601100000058,
          "code": 0
        },
        {
          "ms": 275.9768450000047,
          "code": 0
        },
        {
          "ms": 260.44194199999765,
          "code": 0
        },
        {
          "ms": 311.38154999999824,
          "code": 0
        },
        {
          "ms": 297.4153329999972,
          "code": 0
        },
        {
          "ms": 219.63604499999929,
          "code": 0
        },
        {
          "ms": 194.17949500000395,
          "code": 0
        },
        {
          "ms": 277.8931850000008,
          "code": 0
        },
        {
          "ms": 285.4217409999983,
          "code": 0
        },
        {
          "ms": 236.1303110000008,
          "code": 0
        },
        {
          "ms": 264.5123800000001,
          "code": 0
        },
        {
          "ms": 245.92212299999665,
          "code": 0
        },
        {
          "ms": 257.8040009999968,
          "code": 0
        },
        {
          "ms": 240.56094999999914,
          "code": 0
        },
        {
          "ms": 207.1759779999993,
          "code": 0
        },
        {
          "ms": 312.7920260000028,
          "code": 0
        },
        {
          "ms": 228.14432600000146,
          "code": 0
        },
        {
          "ms": 286.9987790000014,
          "code": 0
        },
        {
          "ms": 273.77164600000106,
          "code": 0
        },
        {
          "ms": 264.2176309999995,
          "code": 0
        },
        {
          "ms": 190.235937999998,
          "code": 0
        },
        {
          "ms": 297.37091100000544,
          "code": 0
        }
      ]
    },
    {
      "mutation": "settle",
      "sessions": 20,
      "n": 40,
      "errors": [],
      "p50": 396.8911799999987,
      "p95": 524.9616199999946,
      "p99": 564.0710380000019,
      "max": 564.0710380000019,
      "peakDirectChildren": 20,
      "observations": [
        {
          "ms": 396.8911799999987,
          "code": 0
        },
        {
          "ms": 314.11239500000374,
          "code": 0
        },
        {
          "ms": 425.62051000000065,
          "code": 0
        },
        {
          "ms": 481.65604899999744,
          "code": 0
        },
        {
          "ms": 407.1877650000024,
          "code": 0
        },
        {
          "ms": 286.0320439999996,
          "code": 0
        },
        {
          "ms": 444.30732899999566,
          "code": 0
        },
        {
          "ms": 300.7269989999986,
          "code": 0
        },
        {
          "ms": 486.08058000000165,
          "code": 0
        },
        {
          "ms": 334.54929199999606,
          "code": 0
        },
        {
          "ms": 433.929449999996,
          "code": 0
        },
        {
          "ms": 463.39751299999625,
          "code": 0
        },
        {
          "ms": 317.85430999999517,
          "code": 0
        },
        {
          "ms": 365.5136890000067,
          "code": 0
        },
        {
          "ms": 351.48856700000033,
          "code": 0
        },
        {
          "ms": 268.23515000000043,
          "code": 0
        },
        {
          "ms": 409.09939999999915,
          "code": 0
        },
        {
          "ms": 339.18076499999734,
          "code": 0
        },
        {
          "ms": 494.8150139999998,
          "code": 0
        },
        {
          "ms": 374.46962599999824,
          "code": 0
        },
        {
          "ms": 312.6628670000064,
          "code": 0
        },
        {
          "ms": 352.0999230000016,
          "code": 0
        },
        {
          "ms": 564.0710380000019,
          "code": 0
        },
        {
          "ms": 475.5786459999945,
          "code": 0
        },
        {
          "ms": 367.40808399999514,
          "code": 0
        },
        {
          "ms": 280.6048989999981,
          "code": 0
        },
        {
          "ms": 292.55877399999736,
          "code": 0
        },
        {
          "ms": 378.31410000000324,
          "code": 0
        },
        {
          "ms": 452.3039179999978,
          "code": 0
        },
        {
          "ms": 328.11364299999696,
          "code": 0
        },
        {
          "ms": 434.64657299999817,
          "code": 0
        },
        {
          "ms": 253.88301599999977,
          "code": 0
        },
        {
          "ms": 460.4229570000025,
          "code": 0
        },
        {
          "ms": 423.3077609999964,
          "code": 0
        },
        {
          "ms": 506.18437699999777,
          "code": 0
        },
        {
          "ms": 407.8639289999992,
          "code": 0
        },
        {
          "ms": 386.1419919999971,
          "code": 0
        },
        {
          "ms": 482.54696500000136,
          "code": 0
        },
        {
          "ms": 524.9616199999946,
          "code": 0
        },
        {
          "ms": 535.1516100000008,
          "code": 0
        }
      ]
    }
  ]
}
```

## Raw historical Node-payload baseline (not the host record)

```json
{
  "contract": "v-spawn-benchmark.v1",
  "generatedAt": "2026-10-18T04:55:57.261Z",
  "checkout": "/home/vantt/projects/forgent/.claude/worktrees/es-p01",
  "commit": "0ce27efc380c8089b433a12dd55ac28c75dfa699",
  "containsReadClaimsFix": true,
  "filesystem": "ext4",
  "mount": "/dev/nvme0n1p2[/home/vantt/projects/forgent/.claude/worktrees/es-p01] ext4",
  "root": "/home/vantt/projects/forgent/.claude/worktrees/es-p01/scripts/event-store/bench-fixture",
  "hostBin": "/home/vantt/.local/state/fgos/releases/sha256:f88afb1769b78b06f3b4c4d7c6bf8b1ec4bcc848ced5828453f546dc4eb60374/bin/fgos",
  "node": "v24.22.0",
  "cpu": "13th Gen Intel(R) Core(TM) i7-13700",
  "logicalCpus": 24,
  "samples": 40,
  "sessions": [
    1,
    10,
    20
  ],
  "rows": [
    {
      "mutation": "claim",
      "sessions": 1,
      "n": 40,
      "errors": [],
      "p50": 176.802408,
      "p95": 193.65147400000023,
      "p99": 218.1663450000001,
      "max": 218.1663450000001,
      "peakDirectChildren": 1,
      "observations": [
        {
          "ms": 168.08668099999997,
          "code": 0
        },
        {
          "ms": 193.31693599999994,
          "code": 0
        },
        {
          "ms": 187.122114,
          "code": 0
        },
        {
          "ms": 144.291972,
          "code": 0
        },
        {
          "ms": 171.43724500000008,
          "code": 0
        },
        {
          "ms": 147.43968600000017,
          "code": 0
        },
        {
          "ms": 149.564077,
          "code": 0
        },
        {
          "ms": 134.4317219999998,
          "code": 0
        },
        {
          "ms": 135.33377799999994,
          "code": 0
        },
        {
          "ms": 135.67584399999987,
          "code": 0
        },
        {
          "ms": 136.65948400000002,
          "code": 0
        },
        {
          "ms": 179.34717299999988,
          "code": 0
        },
        {
          "ms": 191.066597,
          "code": 0
        },
        {
          "ms": 193.65147400000023,
          "code": 0
        },
        {
          "ms": 152.98270900000034,
          "code": 0
        },
        {
          "ms": 171.3600650000003,
          "code": 0
        },
        {
          "ms": 165.57772299999988,
          "code": 0
        },
        {
          "ms": 170.9656540000001,
          "code": 0
        },
        {
          "ms": 176.12586800000008,
          "code": 0
        },
        {
          "ms": 199.7344549999998,
          "code": 0
        },
        {
          "ms": 218.1663450000001,
          "code": 0
        },
        {
          "ms": 176.86565599999994,
          "code": 0
        },
        {
          "ms": 186.847354,
          "code": 0
        },
        {
          "ms": 176.802408,
          "code": 0
        },
        {
          "ms": 188.24693299999944,
          "code": 0
        },
        {
          "ms": 193.543318,
          "code": 0
        },
        {
          "ms": 167.22483399999965,
          "code": 0
        },
        {
          "ms": 184.9914630000003,
          "code": 0
        },
        {
          "ms": 181.37861900000007,
          "code": 0
        },
        {
          "ms": 156.47918200000004,
          "code": 0
        },
        {
          "ms": 188.84287500000028,
          "code": 0
        },
        {
          "ms": 189.96747499999947,
          "code": 0
        },
        {
          "ms": 180.66338900000028,
          "code": 0
        },
        {
          "ms": 149.58022100000017,
          "code": 0
        },
        {
          "ms": 140.2673590000004,
          "code": 0
        },
        {
          "ms": 185.07975800000077,
          "code": 0
        },
        {
          "ms": 187.3410189999995,
          "code": 0
        },
        {
          "ms": 169.07409899999948,
          "code": 0
        },
        {
          "ms": 191.33166699999947,
          "code": 0
        },
        {
          "ms": 184.61160799999925,
          "code": 0
        }
      ]
    },
    {
      "mutation": "claim",
      "sessions": 10,
      "n": 40,
      "errors": [],
      "p50": 198.83072900000025,
      "p95": 292.50852699999996,
      "p99": 333.6299220000001,
      "max": 333.6299220000001,
      "peakDirectChildren": 10,
      "observations": [
        {
          "ms": 271.9160329999995,
          "code": 0
        },
        {
          "ms": 187.17853999999988,
          "code": 0
        },
        {
          "ms": 160.30200700000023,
          "code": 0
        },
        {
          "ms": 237.2967920000001,
          "code": 0
        },
        {
          "ms": 167.74164299999939,
          "code": 0
        },
        {
          "ms": 195.2652339999995,
          "code": 0
        },
        {
          "ms": 204.88600099999985,
          "code": 0
        },
        {
          "ms": 146.4769899999992,
          "code": 0
        },
        {
          "ms": 244.67316299999948,
          "code": 0
        },
        {
          "ms": 176.37262900000042,
          "code": 0
        },
        {
          "ms": 233.0876360000002,
          "code": 0
        },
        {
          "ms": 201.7638220000008,
          "code": 0
        },
        {
          "ms": 175.38615200000004,
          "code": 0
        },
        {
          "ms": 164.7993979999992,
          "code": 0
        },
        {
          "ms": 148.77462500000001,
          "code": 0
        },
        {
          "ms": 202.83822699999928,
          "code": 0
        },
        {
          "ms": 251.06533600000057,
          "code": 0
        },
        {
          "ms": 307.29095899999993,
          "code": 0
        },
        {
          "ms": 172.71641900000031,
          "code": 0
        },
        {
          "ms": 234.40310799999952,
          "code": 0
        },
        {
          "ms": 184.04512000000068,
          "code": 0
        },
        {
          "ms": 215.71779400000014,
          "code": 0
        },
        {
          "ms": 292.50852699999996,
          "code": 0
        },
        {
          "ms": 333.6299220000001,
          "code": 0
        },
        {
          "ms": 257.9216670000005,
          "code": 0
        },
        {
          "ms": 231.8798280000001,
          "code": 0
        },
        {
          "ms": 151.9823860000006,
          "code": 0
        },
        {
          "ms": 163.28894200000013,
          "code": 0
        },
        {
          "ms": 167.7199559999999,
          "code": 0
        },
        {
          "ms": 187.777916,
          "code": 0
        },
        {
          "ms": 221.55022700000063,
          "code": 0
        },
        {
          "ms": 253.01939700000003,
          "code": 0
        },
        {
          "ms": 152.75259099999948,
          "code": 0
        },
        {
          "ms": 162.1451879999995,
          "code": 0
        },
        {
          "ms": 214.03475400000025,
          "code": 0
        },
        {
          "ms": 183.01040399999965,
          "code": 0
        },
        {
          "ms": 198.83072900000025,
          "code": 0
        },
        {
          "ms": 222.3143089999994,
          "code": 0
        },
        {
          "ms": 176.42564700000003,
          "code": 0
        },
        {
          "ms": 238.6850969999996,
          "code": 0
        }
      ]
    },
    {
      "mutation": "claim",
      "sessions": 20,
      "n": 40,
      "errors": [],
      "p50": 297.2393410000004,
      "p95": 470.34072800000104,
      "p99": 523.3675509999994,
      "max": 523.3675509999994,
      "peakDirectChildren": 20,
      "observations": [
        {
          "ms": 399.7020649999995,
          "code": 0
        },
        {
          "ms": 210.41213100000095,
          "code": 0
        },
        {
          "ms": 253.19809600000008,
          "code": 0
        },
        {
          "ms": 432.75794399999904,
          "code": 0
        },
        {
          "ms": 297.2393410000004,
          "code": 0
        },
        {
          "ms": 233.39948000000004,
          "code": 0
        },
        {
          "ms": 278.908942,
          "code": 0
        },
        {
          "ms": 315.87800499999867,
          "code": 0
        },
        {
          "ms": 260.1893230000005,
          "code": 0
        },
        {
          "ms": 338.77638300000035,
          "code": 0
        },
        {
          "ms": 367.27457700000014,
          "code": 0
        },
        {
          "ms": 219.9432940000006,
          "code": 0
        },
        {
          "ms": 351.5267309999999,
          "code": 0
        },
        {
          "ms": 326.7225120000003,
          "code": 0
        },
        {
          "ms": 281.1339939999998,
          "code": 0
        },
        {
          "ms": 210.07614599999943,
          "code": 0
        },
        {
          "ms": 302.2816980000007,
          "code": 0
        },
        {
          "ms": 231.16178599999876,
          "code": 0
        },
        {
          "ms": 439.41451600000073,
          "code": 0
        },
        {
          "ms": 263.06480900000133,
          "code": 0
        },
        {
          "ms": 416.4794099999999,
          "code": 0
        },
        {
          "ms": 368.0497699999996,
          "code": 0
        },
        {
          "ms": 321.17287000000033,
          "code": 0
        },
        {
          "ms": 507.1637780000001,
          "code": 0
        },
        {
          "ms": 203.4359029999996,
          "code": 0
        },
        {
          "ms": 523.3675509999994,
          "code": 0
        },
        {
          "ms": 289.5717160000004,
          "code": 0
        },
        {
          "ms": 257.45478899999944,
          "code": 0
        },
        {
          "ms": 217.34590000000026,
          "code": 0
        },
        {
          "ms": 248.5699229999991,
          "code": 0
        },
        {
          "ms": 296.94937299999947,
          "code": 0
        },
        {
          "ms": 449.201094,
          "code": 0
        },
        {
          "ms": 377.39805199999864,
          "code": 0
        },
        {
          "ms": 267.85656299999937,
          "code": 0
        },
        {
          "ms": 223.9972859999998,
          "code": 0
        },
        {
          "ms": 233.18693799999892,
          "code": 0
        },
        {
          "ms": 318.5811759999997,
          "code": 0
        },
        {
          "ms": 470.34072800000104,
          "code": 0
        },
        {
          "ms": 385.1848109999992,
          "code": 0
        },
        {
          "ms": 348.21203400000013,
          "code": 0
        }
      ]
    },
    {
      "mutation": "move",
      "sessions": 1,
      "n": 40,
      "errors": [],
      "p50": 117.17146700000012,
      "p95": 129.09010399999897,
      "p99": 131.1778259999992,
      "max": 131.1778259999992,
      "peakDirectChildren": 1,
      "observations": [
        {
          "ms": 115.74497300000075,
          "code": 0
        },
        {
          "ms": 114.02769100000114,
          "code": 0
        },
        {
          "ms": 109.17462799999885,
          "code": 0
        },
        {
          "ms": 117.20604700000149,
          "code": 0
        },
        {
          "ms": 131.1778259999992,
          "code": 0
        },
        {
          "ms": 118.2754240000013,
          "code": 0
        },
        {
          "ms": 129.66670800000065,
          "code": 0
        },
        {
          "ms": 118.72489399999904,
          "code": 0
        },
        {
          "ms": 110.85989299999892,
          "code": 0
        },
        {
          "ms": 118.47561300000052,
          "code": 0
        },
        {
          "ms": 115.11182199999894,
          "code": 0
        },
        {
          "ms": 116.70964400000048,
          "code": 0
        },
        {
          "ms": 115.77084900000045,
          "code": 0
        },
        {
          "ms": 120.50108200000068,
          "code": 0
        },
        {
          "ms": 122.98940799999946,
          "code": 0
        },
        {
          "ms": 117.3081689999999,
          "code": 0
        },
        {
          "ms": 118.92539899999974,
          "code": 0
        },
        {
          "ms": 123.10562000000027,
          "code": 0
        },
        {
          "ms": 118.02287699999943,
          "code": 0
        },
        {
          "ms": 118.06296600000132,
          "code": 0
        },
        {
          "ms": 119.62546500000099,
          "code": 0
        },
        {
          "ms": 117.12690400000065,
          "code": 0
        },
        {
          "ms": 112.56584800000019,
          "code": 0
        },
        {
          "ms": 125.65891700000066,
          "code": 0
        },
        {
          "ms": 119.29609700000037,
          "code": 0
        },
        {
          "ms": 112.58318700000018,
          "code": 0
        },
        {
          "ms": 112.61789499999941,
          "code": 0
        },
        {
          "ms": 115.75869000000057,
          "code": 0
        },
        {
          "ms": 112.95106200000009,
          "code": 0
        },
        {
          "ms": 114.47206200000073,
          "code": 0
        },
        {
          "ms": 113.14012600000024,
          "code": 0
        },
        {
          "ms": 121.80752600000051,
          "code": 0
        },
        {
          "ms": 112.98934100000042,
          "code": 0
        },
        {
          "ms": 117.21124100000088,
          "code": 0
        },
        {
          "ms": 127.71181400000023,
          "code": 0
        },
        {
          "ms": 117.07106799999929,
          "code": 0
        },
        {
          "ms": 129.09010399999897,
          "code": 0
        },
        {
          "ms": 117.17146700000012,
          "code": 0
        },
        {
          "ms": 116.0658970000004,
          "code": 0
        },
        {
          "ms": 112.58530799999971,
          "code": 0
        }
      ]
    },
    {
      "mutation": "move",
      "sessions": 10,
      "n": 40,
      "errors": [],
      "p50": 160.87686500000018,
      "p95": 196.09298099999978,
      "p99": 211.35084199999983,
      "max": 211.35084199999983,
      "peakDirectChildren": 10,
      "observations": [
        {
          "ms": 140.2100019999998,
          "code": 0
        },
        {
          "ms": 133.6649529999995,
          "code": 0
        },
        {
          "ms": 175.6146379999991,
          "code": 0
        },
        {
          "ms": 151.0259019999994,
          "code": 0
        },
        {
          "ms": 116.53333400000156,
          "code": 0
        },
        {
          "ms": 161.56624799999918,
          "code": 0
        },
        {
          "ms": 183.28020300000026,
          "code": 0
        },
        {
          "ms": 141.42549299999882,
          "code": 0
        },
        {
          "ms": 121.1219889999993,
          "code": 0
        },
        {
          "ms": 191.93169900000066,
          "code": 0
        },
        {
          "ms": 171.59588799999983,
          "code": 0
        },
        {
          "ms": 148.80447399999866,
          "code": 0
        },
        {
          "ms": 165.26486600000135,
          "code": 0
        },
        {
          "ms": 153.6868029999987,
          "code": 0
        },
        {
          "ms": 135.05357300000105,
          "code": 0
        },
        {
          "ms": 130.9007529999999,
          "code": 0
        },
        {
          "ms": 173.9060300000001,
          "code": 0
        },
        {
          "ms": 121.87588200000027,
          "code": 0
        },
        {
          "ms": 139.8155020000013,
          "code": 0
        },
        {
          "ms": 154.94817700000021,
          "code": 0
        },
        {
          "ms": 176.09063699999933,
          "code": 0
        },
        {
          "ms": 149.45974300000125,
          "code": 0
        },
        {
          "ms": 160.87686500000018,
          "code": 0
        },
        {
          "ms": 185.6580099999992,
          "code": 0
        },
        {
          "ms": 134.5578690000002,
          "code": 0
        },
        {
          "ms": 163.926786,
          "code": 0
        },
        {
          "ms": 139.5835790000001,
          "code": 0
        },
        {
          "ms": 194.92093800000112,
          "code": 0
        },
        {
          "ms": 172.32604899999933,
          "code": 0
        },
        {
          "ms": 148.48909900000035,
          "code": 0
        },
        {
          "ms": 196.09298099999978,
          "code": 0
        },
        {
          "ms": 205.35355600000003,
          "code": 0
        },
        {
          "ms": 160.21600200000103,
          "code": 0
        },
        {
          "ms": 176.0781189999998,
          "code": 0
        },
        {
          "ms": 188.87158799999997,
          "code": 0
        },
        {
          "ms": 161.87357399999928,
          "code": 0
        },
        {
          "ms": 179.3700430000008,
          "code": 0
        },
        {
          "ms": 150.31617200000073,
          "code": 0
        },
        {
          "ms": 211.35084199999983,
          "code": 0
        },
        {
          "ms": 161.48589399999946,
          "code": 0
        }
      ]
    },
    {
      "mutation": "move",
      "sessions": 20,
      "n": 40,
      "errors": [],
      "p50": 238.17065600000024,
      "p95": 343.7304729999996,
      "p99": 351.70290900000145,
      "max": 351.70290900000145,
      "peakDirectChildren": 20,
      "observations": [
        {
          "ms": 299.94970400000057,
          "code": 0
        },
        {
          "ms": 325.27652300000045,
          "code": 0
        },
        {
          "ms": 343.7304729999996,
          "code": 0
        },
        {
          "ms": 313.40535499999896,
          "code": 0
        },
        {
          "ms": 351.70290900000145,
          "code": 0
        },
        {
          "ms": 246.4006790000003,
          "code": 0
        },
        {
          "ms": 251.94756099999904,
          "code": 0
        },
        {
          "ms": 173.00396499999988,
          "code": 0
        },
        {
          "ms": 228.841273,
          "code": 0
        },
        {
          "ms": 179.93734100000074,
          "code": 0
        },
        {
          "ms": 157.65570200000002,
          "code": 0
        },
        {
          "ms": 283.78671399999985,
          "code": 0
        },
        {
          "ms": 234.24101300000075,
          "code": 0
        },
        {
          "ms": 208.82834899999943,
          "code": 0
        },
        {
          "ms": 215.3924300000017,
          "code": 0
        },
        {
          "ms": 201.3055830000012,
          "code": 0
        },
        {
          "ms": 192.0283610000006,
          "code": 0
        },
        {
          "ms": 252.71142800000052,
          "code": 0
        },
        {
          "ms": 262.56904399999985,
          "code": 0
        },
        {
          "ms": 184.62326699999903,
          "code": 0
        },
        {
          "ms": 253.40053799999987,
          "code": 0
        },
        {
          "ms": 229.43240399999922,
          "code": 0
        },
        {
          "ms": 315.8323250000012,
          "code": 0
        },
        {
          "ms": 220.05102400000033,
          "code": 0
        },
        {
          "ms": 346.35919999999896,
          "code": 0
        },
        {
          "ms": 231.70521499999995,
          "code": 0
        },
        {
          "ms": 194.66001399999914,
          "code": 0
        },
        {
          "ms": 269.4360969999998,
          "code": 0
        },
        {
          "ms": 282.56278999999995,
          "code": 0
        },
        {
          "ms": 289.526425,
          "code": 0
        },
        {
          "ms": 234.34059100000013,
          "code": 0
        },
        {
          "ms": 253.07244799999899,
          "code": 0
        },
        {
          "ms": 174.63943699999982,
          "code": 0
        },
        {
          "ms": 331.1990960000003,
          "code": 0
        },
        {
          "ms": 238.17065600000024,
          "code": 0
        },
        {
          "ms": 295.8075600000011,
          "code": 0
        },
        {
          "ms": 196.62192199999845,
          "code": 0
        },
        {
          "ms": 316.33745400000043,
          "code": 0
        },
        {
          "ms": 158.5393640000002,
          "code": 0
        },
        {
          "ms": 201.3345330000011,
          "code": 0
        }
      ]
    },
    {
      "mutation": "settle",
      "sessions": 1,
      "n": 40,
      "errors": [],
      "p50": 150.3712459999988,
      "p95": 169.75075899999865,
      "p99": 177.5875840000008,
      "max": 177.5875840000008,
      "peakDirectChildren": 1,
      "observations": [
        {
          "ms": 138.58537699999943,
          "code": 0
        },
        {
          "ms": 160.99433599999975,
          "code": 0
        },
        {
          "ms": 155.89365399999951,
          "code": 0
        },
        {
          "ms": 140.47041900000113,
          "code": 0
        },
        {
          "ms": 141.5830730000016,
          "code": 0
        },
        {
          "ms": 162.080242,
          "code": 0
        },
        {
          "ms": 146.05651099999886,
          "code": 0
        },
        {
          "ms": 131.09691200000088,
          "code": 0
        },
        {
          "ms": 137.1737630000025,
          "code": 0
        },
        {
          "ms": 160.0927730000003,
          "code": 0
        },
        {
          "ms": 156.99195899999904,
          "code": 0
        },
        {
          "ms": 169.62690099999963,
          "code": 0
        },
        {
          "ms": 133.77326600000015,
          "code": 0
        },
        {
          "ms": 169.75075899999865,
          "code": 0
        },
        {
          "ms": 159.81587199999922,
          "code": 0
        },
        {
          "ms": 166.95432000000073,
          "code": 0
        },
        {
          "ms": 153.07202099999995,
          "code": 0
        },
        {
          "ms": 177.5875840000008,
          "code": 0
        },
        {
          "ms": 160.40187900000092,
          "code": 0
        },
        {
          "ms": 150.3712459999988,
          "code": 0
        },
        {
          "ms": 147.72539899999902,
          "code": 0
        },
        {
          "ms": 156.478783999999,
          "code": 0
        },
        {
          "ms": 136.03513699999894,
          "code": 0
        },
        {
          "ms": 154.2009450000005,
          "code": 0
        },
        {
          "ms": 133.28624299999865,
          "code": 0
        },
        {
          "ms": 168.2416860000012,
          "code": 0
        },
        {
          "ms": 164.67598500000167,
          "code": 0
        },
        {
          "ms": 136.4244800000015,
          "code": 0
        },
        {
          "ms": 143.02468200000294,
          "code": 0
        },
        {
          "ms": 145.69455899999957,
          "code": 0
        },
        {
          "ms": 160.0163939999984,
          "code": 0
        },
        {
          "ms": 144.6514160000006,
          "code": 0
        },
        {
          "ms": 145.17308499999854,
          "code": 0
        },
        {
          "ms": 150.39746899999955,
          "code": 0
        },
        {
          "ms": 139.99626799999896,
          "code": 0
        },
        {
          "ms": 152.4121750000013,
          "code": 0
        },
        {
          "ms": 173.87202999999863,
          "code": 0
        },
        {
          "ms": 145.7770359999995,
          "code": 0
        },
        {
          "ms": 127.5159390000008,
          "code": 0
        },
        {
          "ms": 149.8326240000024,
          "code": 0
        }
      ]
    },
    {
      "mutation": "settle",
      "sessions": 10,
      "n": 40,
      "errors": [],
      "p50": 204.73620599999776,
      "p95": 275.0128199999999,
      "p99": 286.01222899999993,
      "max": 286.01222899999993,
      "peakDirectChildren": 10,
      "observations": [
        {
          "ms": 225.04332200000135,
          "code": 0
        },
        {
          "ms": 267.98838700000124,
          "code": 0
        },
        {
          "ms": 178.73060500000065,
          "code": 0
        },
        {
          "ms": 240.97297199999957,
          "code": 0
        },
        {
          "ms": 208.39707900000212,
          "code": 0
        },
        {
          "ms": 286.01222899999993,
          "code": 0
        },
        {
          "ms": 227.20771299999979,
          "code": 0
        },
        {
          "ms": 194.9276949999985,
          "code": 0
        },
        {
          "ms": 159.3473269999995,
          "code": 0
        },
        {
          "ms": 176.5440950000011,
          "code": 0
        },
        {
          "ms": 241.9484470000025,
          "code": 0
        },
        {
          "ms": 159.2085619999998,
          "code": 0
        },
        {
          "ms": 205.14167600000292,
          "code": 0
        },
        {
          "ms": 227.51212099999975,
          "code": 0
        },
        {
          "ms": 254.15571700000146,
          "code": 0
        },
        {
          "ms": 142.74105699999927,
          "code": 0
        },
        {
          "ms": 170.6249480000006,
          "code": 0
        },
        {
          "ms": 179.36804300000222,
          "code": 0
        },
        {
          "ms": 211.36092500000086,
          "code": 0
        },
        {
          "ms": 192.58023900000262,
          "code": 0
        },
        {
          "ms": 177.81675900000118,
          "code": 0
        },
        {
          "ms": 144.57027299999754,
          "code": 0
        },
        {
          "ms": 156.5668829999995,
          "code": 0
        },
        {
          "ms": 275.0128199999999,
          "code": 0
        },
        {
          "ms": 210.0125079999998,
          "code": 0
        },
        {
          "ms": 204.73620599999776,
          "code": 0
        },
        {
          "ms": 224.08850600000005,
          "code": 0
        },
        {
          "ms": 163.31419399999868,
          "code": 0
        },
        {
          "ms": 190.06837599999926,
          "code": 0
        },
        {
          "ms": 244.5442490000023,
          "code": 0
        },
        {
          "ms": 248.6187510000018,
          "code": 0
        },
        {
          "ms": 239.0408479999969,
          "code": 0
        },
        {
          "ms": 220.2717410000041,
          "code": 0
        },
        {
          "ms": 186.5455839999995,
          "code": 0
        },
        {
          "ms": 174.35189400000672,
          "code": 0
        },
        {
          "ms": 212.96956800000044,
          "code": 0
        },
        {
          "ms": 151.44350500000292,
          "code": 0
        },
        {
          "ms": 280.1998999999996,
          "code": 0
        },
        {
          "ms": 140.38800599999377,
          "code": 0
        },
        {
          "ms": 196.2134470000019,
          "code": 0
        }
      ]
    },
    {
      "mutation": "settle",
      "sessions": 20,
      "n": 40,
      "errors": [],
      "p50": 318.7410899999959,
      "p95": 451.28637100000196,
      "p99": 480.2240380000003,
      "max": 480.2240380000003,
      "peakDirectChildren": 20,
      "observations": [
        {
          "ms": 407.9283439999999,
          "code": 0
        },
        {
          "ms": 180.2406540000011,
          "code": 0
        },
        {
          "ms": 335.49823099999776,
          "code": 0
        },
        {
          "ms": 275.05754600000364,
          "code": 0
        },
        {
          "ms": 380.473576999997,
          "code": 0
        },
        {
          "ms": 218.62438800000382,
          "code": 0
        },
        {
          "ms": 297.1212779999987,
          "code": 0
        },
        {
          "ms": 196.99247099999775,
          "code": 0
        },
        {
          "ms": 284.3488569999972,
          "code": 0
        },
        {
          "ms": 229.1050380000015,
          "code": 0
        },
        {
          "ms": 318.7410899999959,
          "code": 0
        },
        {
          "ms": 248.24470499999734,
          "code": 0
        },
        {
          "ms": 449.16456599999947,
          "code": 0
        },
        {
          "ms": 234.2480729999952,
          "code": 0
        },
        {
          "ms": 256.57060600000113,
          "code": 0
        },
        {
          "ms": 299.5651580000049,
          "code": 0
        },
        {
          "ms": 347.4090700000015,
          "code": 0
        },
        {
          "ms": 422.25367499999993,
          "code": 0
        },
        {
          "ms": 383.58253700000205,
          "code": 0
        },
        {
          "ms": 355.4750849999982,
          "code": 0
        },
        {
          "ms": 238.6135510000022,
          "code": 0
        },
        {
          "ms": 420.6371819999986,
          "code": 0
        },
        {
          "ms": 480.2240380000003,
          "code": 0
        },
        {
          "ms": 398.779137000005,
          "code": 0
        },
        {
          "ms": 473.3985580000008,
          "code": 0
        },
        {
          "ms": 451.28637100000196,
          "code": 0
        },
        {
          "ms": 326.0073810000031,
          "code": 0
        },
        {
          "ms": 274.371699000003,
          "code": 0
        },
        {
          "ms": 264.788066000001,
          "code": 0
        },
        {
          "ms": 298.5481230000005,
          "code": 0
        },
        {
          "ms": 403.8378339999981,
          "code": 0
        },
        {
          "ms": 376.60341699999844,
          "code": 0
        },
        {
          "ms": 343.4820030000046,
          "code": 0
        },
        {
          "ms": 355.99442799999815,
          "code": 0
        },
        {
          "ms": 364.6871269999974,
          "code": 0
        },
        {
          "ms": 278.42479699999967,
          "code": 0
        },
        {
          "ms": 296.08114800000476,
          "code": 0
        },
        {
          "ms": 320.6372629999969,
          "code": 0
        },
        {
          "ms": 211.37150999999722,
          "code": 0
        },
        {
          "ms": 234.6412130000026,
          "code": 0
        }
      ]
    }
  ],
  "entry": "node-payload",
  "entryAnnotation": "Retrospective annotation: unit-2 harness spawned node bin/fgos.mjs; timing observations are unchanged."
}
```
