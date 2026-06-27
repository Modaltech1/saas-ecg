"use client"

import { Eye, EyeOff } from "lucide-react"
import { type ComponentProps } from "react"
import { Input } from "@/components/ui/input"

interface PasswordInputProps extends ComponentProps<"input"> {
  visible: boolean
  onToggleVisible: () => void
}

export function PasswordInput({ visible, onToggleVisible, className, ...props }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={["pr-10", className].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
