import { AIBotStudio } from "@/components/app-studio/ai-bot-studio"
import { AIBotExecution } from "@/components/app-studio/ai-bot-execution"
import { AIBotOwnerApprovalPanel } from "@/components/app-studio/ai-bot-owner-approval-panel"
import { AppShell } from "@/components/app-shell"
export default function AIBotsPage() { return <><AIBotStudio /><AppShell><main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 lg:px-8"><AIBotOwnerApprovalPanel /><AIBotExecution /></main></AppShell></> }
