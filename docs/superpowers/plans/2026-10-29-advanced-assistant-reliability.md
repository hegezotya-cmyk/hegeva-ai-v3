# Advanced Assistant reliability and answer quality

User specification: fix the whole failing request flow and provide more developed, sensible answers. Keep Standard unchanged, Advanced 8 credits and exact refunds; show verified results before production.

Use systematic-debugging, test-driven-development and executing-plans. Existing isolated worktree; branch fix/advanced-assistant-timeout.

- [x] Reproduce the 10-second cutoff with a controlled 11-second provider response.
- [x] Advanced gets a bounded 45-second provider deadline, 60-second browser wait and 65-second distributed lease; Standard keeps its existing deadlines. No automatic retries or model/price changes. Live evidence required a 2048-token total output budget including reasoning, with a matching conservative 271-unit provider reservation.
- [ ] Distinguish confirmed refunded timeouts from ambiguous connection failure. Refresh credits and allow an explicit new attempt after confirmed timeout.
- [ ] Advanced instructions prioritize actionable recommendations, rationale, assumptions, concrete measures and at most one necessary clarification; no invented workspace facts or actions.
- [ ] Run executable provider, credit, concurrency and frontend checks, full release checks and independent review.
- [ ] Verify exact-head Linux and authenticated staging using the actual weekly acquisition question plus incomplete/failure and Standard checks. Restore temporary settings, clear synthetic chat and present results.
