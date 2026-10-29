# Advanced answer grounding repair — 2026-10-29

Scope: repair context loss and remove shared product-navigation priming from Advanced; retain Standard, model, price, timeouts and provider reservation. No live calls, budget changes or production deployment authorized.

Evidence: four live acquisition answers invented UI capabilities or results despite appended warnings. The Advanced boundary discards safeHistory and businessContext. It also prepends broad product capability copy to every ordinary business request. Context loss is reproducible; the link between product priming and hallucinations is a hypothesis requiring later live acceptance.

1. Add failing provider and real HTTP tests for Advanced history/context propagation, trust separation, bounded input and unchanged Standard.
2. Give Advanced a standalone concise task-centered policy; carry user-provided context as a labelled user message and preserve bounded recent user/assistant turns. Never promote history/context to developer instructions. Treat prior assistant claims as unverified.
3. Validate current input before reservations. Fit optional context/history within the existing serialized byte ceiling, preserve the current request and never increase token/cost ceilings. Use the same preparation in admission and execution.
4. Run regression suites and release checks. Record remaining live quality gate honestly. Do not deploy or spend more staging capacity.
