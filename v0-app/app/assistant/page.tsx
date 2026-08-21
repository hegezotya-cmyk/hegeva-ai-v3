import { AssistantChat } from "@/components/assistant/assistant-chat"

export default function AssistantPage() {
  return (
    <main className="mx-auto min-h-[80vh] max-w-5xl px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Assistant
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Practical AI help connected to the live HEGEVA backend. Answers are generated only after you send a real request.
        </p>
      </div>

      <AssistantChat />
    </main>
  )
}
