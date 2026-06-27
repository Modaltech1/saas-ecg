"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-medium">Voltar</span>
    </button>
  )
}
