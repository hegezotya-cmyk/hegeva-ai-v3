# HEGEVA AI V3 — Instructions for Codex and other coding agents

## Canonical cross-chat checkpoint (read first)

The single source of truth for project handoff is **GitHub Issue #102**:
https://github.com/hegezotya-cmyk/hegeva-ai-v3/issues/102

**Before starting or continuing any HEGEVA task:**

1. Fetch the current issue #102 body. Read the latest checkpoint and open release gates.
2. Cross-check the latest GitHub PR state (#99 for staging / Stripe Sandbox, #101 for production logging privacy), current workflow results, and the deployed Worker versions before asserting status. The issue is a snapshot, not an automatic live view.
3. Classify every claim precisely as `REMOTE PASS`, `ISOLATED/LOCAL PASS`, `OWNER REPORTED`, `BLOCKED`, `NOT RUN`, or `NOT READY`. A CI green test does not imply real remote customer login, Stripe payments, or data isolation.
4. Resume **only the next unproven acceptance step**. Never redo an already proven customer / quote / invoice workflow solely because a new ChatGPT conversation began. Retest only if a relevant code version changed, evidence is insufficient, or there is a newly discovered regression.
5. After meaningful work, update issue #102 with: date and HEAD/deployed commit; evidence links; verified vs unverified states; exact changes; next test; and whether production was touched. Maintain one canonical checkpoint rather than creating divergent summaries.
6. Never copy passwords, tokens, verification URLs, private keys, customer personal information, or secret values into issues, commits, PRs or CI logs. Never run real customer billing or modify Stripe LIVE for tests.
7. **Production is protected**: do not merge into an auto-deploying branch, deploy production Workers, run production D1 writes/migrations, or alter production secrets without explicit, separate owner approval. Do not change staging configuration, deploy, or send real emails without appropriate owner authorization.
8. The release gate remains `releaseSafe=false` / **NOT READY** until every applicable remote gate has auditable evidence and the owner approves the production release. A draft PR is not release authorization.

### For short requests such as "tovább" ("continue")

Begin with issue #102 and the latest tool-visible evidence. Identify the highest-priority pending gate and perform the **smallest safe test or fix**, without repeating completed steps or requesting already provided information. If a proof requires user interaction or a tool not available in Chat mode, state exactly why, and do all safe preparatory work first.

### Boundaries

- Production website: https://hegevaai.co.uk
- Staging website: https://staging.hegevaai.co.uk
- Main staging work: https://github.com/hegezotya-cmyk/hegeva-ai-v3/pull/99
- Production privacy guard: https://github.com/hegezotya-cmyk/hegeva-ai-v3/pull/101

**Do not embed a duplicated, time-sensitive project status in this file. Read issue #102 every time instead.**
