# Phase 4 QA Checklist

## Golden path
- [x] Codex flow dispatch from UI
- [ ] Gemini flow dispatch from UI
- [x] Run lifecycle persists (queued/running/terminal)
- [x] Latest run renders on task detail
- [x] Timeline reflects run lifecycle

## Guardrails
- [x] Dispatch blocked with no approval
- [x] Dispatch blocked with pending approval
- [ ] Dispatch blocked with rejected/wrong approval
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

## Findings

### Fixed during Phase 4
1. **Codex adapter wrapper bug**
   - Repro: dispatch Codex flow run from Task Detail after approval.
   - Expected: run transitions to running/completed.
   - Actual before fix: run failed immediately with `No acpx session found` because the wrapper invoked `acpx` with the wrong syntax (`codex --session ... prompt ...`).
   - Fix: changed invocation to `codex prompt -s <session> ...`.
   - Result: Codex now passes end-to-end from UI.

### Current blocker
2. **Gemini direct `acpx` session path is not healthy yet**
   - Repro: dispatch Review flow with adapter `acpx_gemini`.
   - Expected: run transitions queued -> running -> completed/failed with a useful adapter-level message.
   - Actual: run fails quickly with `Unexpected end of JSON input` from the session-ensure path; manual `acpx gemini prompt -s ...` also reports no session found, and `acpx gemini sessions list` returns `No sessions`.
   - Severity: blocker for full Phase 4 signoff on multi-adapter execution.
   - Likely cause: Gemini `acpx` session bootstrap/ensure behavior differs from Codex and the wrapper currently assumes Codex-like behavior.

## Recommendation
- Phase 4 is **partially passed**:
  - Codex lane: pass
  - core UI/approval/run persistence: pass
  - Gemini lane: blocked
- Next move: patch Gemini session bootstrap/adapter behavior, then rerun the Gemini golden path and rejected/wrong-approval tests.
