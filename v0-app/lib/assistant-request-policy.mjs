export const assistantClientTimeout = tier => tier === "advanced" ? 60_000 : 30_000
export const confirmedAssistantTimeout = (status, data) => status === 504 && data?.code === "ASSISTANT_TIMEOUT" && data?.creditsRefunded === true
export const confirmedAssistantRefund = (status, data) => confirmedAssistantTimeout(status, data) || (status === 502 && data?.code === "ASSISTANT_REQUEST_FAILED" && data?.creditsRefunded === true)
