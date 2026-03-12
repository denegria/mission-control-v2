# Phase 4 QA Checklist

## Golden path
- [x] Codex flow dispatch from UI
- [ ] Gemini flow dispatch from UI (deferred: pending OpenClaw/acpx update)
- [x] Run lifecycle persists (queued/running/terminal)
- [x] Latest run renders on task detail
- [x] Timeline reflects run lifecycle

## Guardrails
- [x] Dispatch blocked with no approval
- [x] Dispatch blocked with pending approval
- [x] Dispatch blocked with rejected/wrong approval
- [x] One active run per flow enforced

## Failure handling
- [x] Failed run surfaces useful error
- [x] No silent death on dispatch failure

## Regression smoke
- [x] Tasks page still works
- [x] Task detail still works
- [x] Approvals page still works
- [x] GitHub issue creation path still loads
- [x] Protocol/handoff controls still load
- [x] Projects/System pages still load

## Findings

### Fixed during Phase 4
1. **Codex adapter wrapper bug**
   - Repro: dispatch Codex flow run from Task Detail after approval.
   - Expected: run transitions to running/completed.
   - Actual before fix: run failed immediately with `No acpx session found` because the wrapper invoked `acpx` with the wrong syntax (`codex --session ... prompt ...`).
   - Fix: changed invocation to `codex prompt -s <session> ...`.
   - Result: Codex now passes end-to-end from UI.

## Deferred external issue
2. **Gemini direct `acpx` lane remains unhealthy in current runtime**
   - Repro: dispatch Review flow with adapter `acpx_gemini`.
   - Expected: run transitions queued -> running -> completed/failed with a useful adapter-level result.
   - Actual: lifecycle wiring works, but Gemini fails at the `acpx` layer in current runtime behavior.
   - Severity: deferred, not a blocker for this phase per operator decision.
   - Disposition: wait for upcoming OpenClaw/acpx update instead of spending more engineering time locally.

## Phase 4 result
- **PASS for Codex-backed execution lane and MC core behavior**
- **Gemini deferred by platform/runtime issue, not treated as a Phase 4 blocker**
