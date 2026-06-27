"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Algo deu errado!</h1>
        <p className="text-gray-600 mb-8">Ocorreu um erro inesperado. Por favor, tente novamente.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
          <Button asChild className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <Link href="/">
              <Home className="w-4 h-4" />
              Ir para Home
            </Link>
          </Button>
        </div>

        {error.digest && <p className="text-xs text-gray-500 mt-8">Código de erro: {error.digest}</p>}
      </div>
    </div>
  )
}
