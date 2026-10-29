# Advanced Assistant reliability and answer quality

The real production weekly-acquisition request timed out at exactly 10,000 ms. Its eight credits were refunded. A controlled provider response completing at 11,000 ms reproduced the failure before the fix (`output/advanced-timing-red.log`).

## Changes

- Advanced provider deadline: 45 seconds; browser wait: 60 seconds; authenticated distributed lease: 65 seconds. Standard retains its existing configured provider deadline, 30-second browser deadline and 35-second lease. Output/model/cost ceilings remain unchanged. No automatic retries.
- The real HTTP route exposes `504 / ASSISTANT_TIMEOUT / creditsRefunded:true` only after confirmed settlement. The UI refreshes usage, explains the refund in all five languages and uses a new operation identity for an explicit subsequent attempt. Ambiguous connection errors retain their prior safe identity behavior.
- Fixed pre-existing catch-scope failure: the handler referenced identities declared only inside its try block. Reproduced as a real-handler ReferenceError before moving the identities into the route scope.
- A review finding showed that a successful top-up timeout settlement does not always restore spendable credits: a refunded/disputed purchase lot revokes them. Confirmation now requires a still-paid lot, reproduced RED and tested with real SQLite.
- Advanced advice asks for prioritized concrete actions, reasons, realistic timing, measurable outcomes and explicit assumptions, with one clarification only when material. Standard instructions remain unchanged. No additional workspace facts or third-party actions are inferred.

## Verification

25 provider/timing/accounting/HTTP regression tests pass. The real HTTP route test verifies all eight credits refunded, terminal timeout identity and concurrency release. A real Durable Object RPC test holds an Advanced lease beyond the former 35-second cutoff and verifies release. Existing economics and usage-settlement tests pass.

Browser, full release, exact-head Linux and authenticated staging results are recorded in the PR and local output evidence after completion. Production requires owner review of those results first. Temporary staging branch access and bounded test budgets are restored after verification; synthetic chat is removed.
