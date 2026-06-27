import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TableDetailsButtonProps = {
  href: string
  label?: string
  className?: string
}

export function TableDetailsButton({ href, label = "Detalhes", className }: TableDetailsButtonProps) {
  return (
    <Button asChild variant="outline" size="sm" className={cn("h-8 gap-1.5 px-3", className)}>
      <Link href={href}>
        {label}
        <ArrowRight className="size-3.5" />
      </Link>
    </Button>
  )
}
