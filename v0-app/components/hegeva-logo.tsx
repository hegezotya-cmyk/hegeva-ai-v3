import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * The single, authoritative HEGEVA brand mark.
 * Uses the supplied official logo asset — never a generic "H" substitute.
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
      src="/hegeva-logo.png"
      alt="HEGEVA AI"
      width={190}
      height={52}
      priority={priority}
      className={cn("h-8 w-auto select-none", className)}
    />
  )

  if (href === null) return mark

  return (
    <Link href={href} aria-label="HEGEVA AI — home" className="inline-flex items-center">
      {mark}
    </Link>
  )
}
