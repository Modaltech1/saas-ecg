"use client"

import Image from "next/image"
import { type ReactNode } from "react"
import { brand } from "@/branding/brand"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardProps {
  title?: string
  description: string
  children: ReactNode
  footer?: ReactNode
  maxWidthClassName?: string
}

export function AuthCard({
  title = brand.appName,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-md",
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className={`w-full ${maxWidthClassName} space-y-6`}>
        <Card className="shadow-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-16 items-center justify-center overflow-hidden rounded-lg bg-card">
              <Image src={brand.logoUrl} alt={brand.appName} width={64} height={64} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>

          <CardContent>{children}</CardContent>
        </Card>

        {footer ?? (
          <a
            href="https://www.prodexylabs.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            desenvolvido por <span className="font-semibold">Prodexy Labs</span>
          </a>
        )}
      </div>
    </main>
  )
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
      <p className="text-sm text-destructive">{children}</p>
    </div>
  )
}
