const SCENARIOS = new Set(["retry-recovery", "lease-fencing"]);
export function guardNameForScenario(scenario) { return SCENARIOS.has(scenario) ? `staging-scheduled-test:${scenario}` : null; }
