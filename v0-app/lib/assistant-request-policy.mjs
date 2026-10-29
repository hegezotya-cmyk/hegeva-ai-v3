export const assistantClientTimeout = tier => tier === "advanced" ? 60_000 : 30_000
export const confirmedAssistantTimeout = (status, data) => status === 504 && data?.code === "ASSISTANT_TIMEOUT" && data?.creditsRefunded === true
