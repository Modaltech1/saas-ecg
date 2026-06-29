import Link from "next/link"
import { AlertCircle, MailCheck } from "lucide-react"
import { AuthCard } from "@/components/shared/auth-card"
import { Button } from "@/components/ui/button"

export default function ConfirmacaoEmailPage() {
  return (
    <AuthCard title="Link expirado" description="Nao foi possivel confirmar o e-mail com este link.">
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertCircle className="size-7" />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            O link pode ja ter sido usado, expirado ou aberto em outro navegador.
          </p>
          <p>
            Solicite um novo e-mail de confirmacao para continuar a ativacao da instituicao.
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
