import type { PublicPortalDocument, PublicPortalSnapshot } from "@/lib/client-portal-public-types"

const DECIMAL = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `${currency} ${DECIMAL.format(value)}`
  }
}

function DocumentView({ document }: { document: PublicPortalDocument }) {
  const type = document.documentType === "invoice" ? "INVOICE" : "QUOTE"
  const dateLabel = document.documentType === "invoice" ? "Due date" : "Valid until"

  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#c99a34]/50 bg-white text-[#17201c] shadow-2xl">
      <header className="flex flex-col gap-5 border-b-[3px] border-[#c99a34] bg-[#070908] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <img src="/hegeva-logo-gold-official.png" alt="HEGEVA AI" width={210} height={70} className="h-auto w-[190px] max-w-full object-contain sm:w-[210px]" />
        <div className="min-w-0 sm:text-right">
          <p className="m-0 text-xs font-bold tracking-[0.16em] text-[#f4c45d]">{type}</p>
          <h1 className="mt-1 overflow-wrap-anywhere text-xl font-bold sm:text-2xl">{document.reference}</h1>
          <p className="mt-1 text-xs text-[#d5dbd5]">Issue date: {document.issueDate} · {dateLabel}: {document.dueDate}</p>
        </div>
      </header>
      <div className="p-5 sm:p-7">
        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-xs font-bold tracking-[0.1em] text-[#26352d]">BUSINESS</h2>
            <p className="mt-2 overflow-wrap-anywhere text-sm font-semibold">{document.business.name}</p>
          </section>
          <section>
            <h2 className="text-xs font-bold tracking-[0.1em] text-[#26352d]">CUSTOMER</h2>
            <p className="mt-2 overflow-wrap-anywhere text-sm font-semibold">{document.customer.name}</p>
          </section>
        </div>
        <div className="mt-7 overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <thead className="bg-[#f1f4f1] text-[10px] tracking-[0.08em] text-[#26352d]">
              <tr><th className="w-[46%] p-2 sm:p-3">DESCRIPTION</th><th className="w-[14%] p-2 sm:p-3">QTY</th><th className="w-[20%] p-2 sm:p-3">UNIT PRICE</th><th className="w-[20%] p-2 sm:p-3">TOTAL</th></tr>
            </thead>
            <tbody>{document.items.map((item, index) => <tr key={`${item.description}-${index}`} className="border-b border-[#d8ddd8] align-top"><td className="overflow-wrap-anywhere p-2 sm:p-3">{item.description}</td><td className="p-2 sm:p-3">{item.quantity}</td><td className="overflow-wrap-anywhere p-2 sm:p-3">{formatMoney(item.unitPrice, document.currency)}</td><td className="overflow-wrap-anywhere p-2 sm:p-3">{formatMoney(item.lineTotal, document.currency)}</td></tr>)}</tbody>
          </table>
        </div>
        <section className="ml-auto mt-7 w-full max-w-xs text-sm">
          <p className="flex justify-between gap-4 py-1"><span>Subtotal</span><strong>{formatMoney(document.subtotal, document.currency)}</strong></p>
          <p className="flex justify-between gap-4 py-1"><span>VAT ({document.vatRate}%)</span><strong>{formatMoney(document.vatAmount, document.currency)}</strong></p>
          <p className="mt-2 flex justify-between gap-4 border-t-2 border-[#17201c] pt-3 text-lg font-bold"><span>Total</span><strong>{formatMoney(document.total, document.currency)}</strong></p>
        </section>
        <footer className="mt-8 border-t border-[#d9ddd9] pt-3 text-xs text-[#5c665f]">HEGEVA AI · {type} · {document.reference}</footer>
      </div>
    </article>
  )
}

export function PublicDocumentView({ snapshot }: { snapshot: PublicPortalSnapshot }) {
  return <div className="space-y-8">{snapshot.documents.map((document) => <DocumentView key={`${document.documentType}-${document.reference}`} document={document} />)}</div>
}
