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
  variant: _variant = "full",
}: {
  className?: string
  href?: string | null
  priority?: boolean
  variant?: "full" | "header"
}) {
  const mark = (
    <Image
      src="/hegeva-logo-gold-header-transparent.png"
      alt="HEGEVA AI"
      width={487}
      height={125}
      priority={priority}
      className={cn("h-10 w-auto max-w-full object-contain select-none", className)}
      style={{ display: "block", width: "10.25rem", height: "auto", maxWidth: "100%" }}
    />
  )

  if (href === null) return mark

  return (
    <Link href={href} aria-label="HEGEVA AI" className="hegeva-brand-mark inline-flex min-w-0 max-w-full items-center">
      {mark}
    </Link>
  )
}
