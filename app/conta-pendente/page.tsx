import Link from "next/link"
import { Clock3, MailCheck } from "lucide-react"
import { AuthCard } from "@/components/shared/auth-card"
import { Button } from "@/components/ui/button"

export default function ContaPendentePage() {
  return (
    <AuthCard title="Confirme seu e-mail" description="Sua instituicao ainda esta aguardando ativacao.">
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Clock3 className="size-7" />
        </div>

        <div className="rounded-lg border bg-background px-4 py-3 text-left text-sm">
          <p className="font-semibold text-foreground">Ativacao pendente</p>
          <p className="mt-1 text-muted-foreground">
            Antes do primeiro acesso, confirme o e-mail usado na criacao da instituicao.
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Verifique a caixa de entrada e o spam. Se o link expirou, solicite um novo envio.
          </p>
        </div>

        <div className="grid gap-3">
          <Button asChild className="w-full">
            <Link href="/reenviar-confirmacao">
              <MailCheck className="size-4" />
              Reenviar confirmacao
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Voltar para login</Link>
          </Button>
        </div>
      </div>
    </AuthCard>
  )
}
