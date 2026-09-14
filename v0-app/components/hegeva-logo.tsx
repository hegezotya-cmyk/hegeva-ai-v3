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
}: {
  className?: string
  href?: string | null
  priority?: boolean
}) {
  const mark = (
    <Image
      src="/hegeva-logo-gold-official.png"
      alt="HEGEVA AI"
      width={2172}
      height={724}
      priority={priority}
      className={cn("h-10 w-auto max-w-full object-contain select-none", className)}
    />
  )

  if (href === null) return mark

  return (
    <Link href={href} aria-label="HEGEVA AI" className="inline-flex items-center">
      {mark}
    </Link>
  )
}
