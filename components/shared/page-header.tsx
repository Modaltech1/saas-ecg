import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Voltar",
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-3xl font-bold tracking-normal">{title}</h1>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{children}</div> : null}
    </div>
  )
}
