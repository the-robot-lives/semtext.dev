## pubsub-status — /pubsub status screen

Purpose: `/pubsub status` — the live poll-loop dashboard: identity (session / org / recipient), channel subscription, injection kinds, cursor and delivery counters, health (last-poll-ok, failures, backoff, last-error). One field per row, label column fixed-width.

State notes:
- **running** — poll loop live; `last-poll-ok` carries age; backoff and last-error show `—` when clean; throttle line names the 5-minute window and when the next batch may deliver.
- **paused** — poll loop halted (header says paused, banner row states how long); counters freeze at pause; a prior 502 shows failures 1 + engaged backoff suppressed while paused; `p` becomes resume ▸.

### state: running

```screen
semtext › pubsub › status                                              ✕
────────────────────────────────────────────────────────────────────────
session        6fbf5cbd-9fc0 · resumed 15:19
org            the-robot-lives
recipient      loom (weego)
channels       reviews · deploys · fleet · ops
injectKinds    mention · digest · ping
cursor         128
batches        4 delivered · 12 items · last 14:32:08
throttles      1 — 5m window · next batch 14:36:41
last-poll-ok   14:32:08 · 2s ago
failures       0
backoff        —
last-error     —
────────────────────────────────────────────────────────────────────────
  p pause · r refresh · c copy cursor · /pubsub close
```

### state: paused (after one 502)

```screen
semtext › pubsub › status · paused                                     ✕
────────────────────────────────────────────────────────────────────────
  paused 41s — poll loop halted · counters frozen at pause
────────────────────────────────────────────────────────────────────────
session        6fbf5cbd-9fc0 · resumed 15:19
org            the-robot-lives
recipient      loom (weego)
channels       reviews · deploys · fleet · ops
injectKinds    mention · digest · ping
cursor         128
batches        4 delivered · 12 items · last 14:33:02
throttles      2 — window held while paused
last-poll-ok   14:33:02 · paused 41s ago
failures       1
backoff        30s — suppressed while paused
last-error     502 Bad Gateway · agentonomi.com/pubsub · 14:33:02
────────────────────────────────────────────────────────────────────────
  ▸ p resume · r refresh · /pubsub close
```
