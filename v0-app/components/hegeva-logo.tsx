import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * The single, authoritative HEGEVA brand mark.
 * Uses the owner-approved premium-gold master asset — never a generic "H" substitute.
 */
export function HegevaLogo({
  className,
  href = "/",
  priority = false,
  variant = "full",
}: {
  className?: string
  href?: string | null
  priority?: boolean
  variant?: "full" | "header"
}) {
  const isHeaderVariant = variant === "header"
  const mark = (
    <Image
      src={isHeaderVariant ? "/hegeva-logo-gold-header.png" : "/hegeva-logo-gold-official.png"}
      alt="HEGEVA AI"
      width={isHeaderVariant ? 501 : 2172}
      height={isHeaderVariant ? 167 : 724}
      priority={priority}
      className={cn("h-10 w-auto max-w-full object-contain select-none", className)}
      style={{ display: "block", width: "10.25rem", height: "auto", maxWidth: "100%" }}
    />
  )

  if (href === null) return mark

  return (
    <Link href={href} aria-label="HEGEVA AI" className="v4-brand-lockup inline-flex min-w-0 max-w-full items-center">
      {mark}
    </Link>
  )
}
