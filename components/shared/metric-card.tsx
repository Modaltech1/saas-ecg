import { Activity, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  tone?: "default" | "success" | "warning" | "danger" | "blue"
}

const toneClass = {
  default: "text-foreground",
  success: "text-[color:var(--success)]",
  warning: "text-[color:var(--warning)]",
  danger: "text-destructive",
  blue: "text-primary",
}

export function MetricCard({ title, value, subtitle, icon: Icon, tone = "default" }: Props) {
  const MetricIcon = Icon ?? Activity

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <MetricIcon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("break-words text-2xl font-bold leading-tight", toneClass[tone])}>{value}</div>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardContent>
    </Card>
  )
}
