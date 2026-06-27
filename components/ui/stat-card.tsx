import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconColor?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  onClick?: () => void
}

export function StatCard({ title, value, icon, iconColor = "text-primary", trend, onClick }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-lg border p-4 shadow-sm",
        onClick && "cursor-pointer transition-colors hover:bg-muted/40",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mb-1 break-words text-2xl font-bold leading-tight text-foreground">{value}</p>
          {trend && (
            <p className={cn("text-xs font-medium", trend.isPositive ? "text-[color:var(--success)]" : "text-destructive")}>
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg bg-muted",
            iconColor.includes("primary") && "bg-primary/10",
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
