import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-emerald-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Página não encontrada</h2>
          <p className="text-gray-600">A página que você está procurando não existe ou foi movida.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="gap-2 bg-transparent">
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <Link href="/">
              <Home className="w-4 h-4" />
              Ir para Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
