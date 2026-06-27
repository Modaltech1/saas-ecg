"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterChipProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  onClear?: () => void
}

export function FilterChip({ label, value, options, onChange, onClear }: FilterChipProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              value === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        ))}
        {value && onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
