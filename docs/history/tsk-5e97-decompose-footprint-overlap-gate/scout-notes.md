## Scout 1

**Command:** `rg -n "footprintOverlapAmong" --type js -g '!node_modules' .`

```
This command requires approval
```

## Scout 2

**Command:** `rg -n "decompose" --files -g '*.mjs' | grep -v node_modules | grep -i decompose`

```
This Bash command contains multiple operations. The following part requires approval: rtk rg -n "decompose" --files -g '*.mjs'
```

## Scout 3

**Command:** `rg -n "decompose" --files -g '*.mjs' -g '!node_modules'`

```
This command requires approval
```
