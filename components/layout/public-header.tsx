"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, CreditCard, Menu, ShoppingBag, Trophy, UserPlus, X } from "lucide-react"
import { brand } from "@/branding/brand"
import { cn } from "@/lib/utils"

interface PublicHeaderProps {
  subtitle?: string
}

const navLinks = [
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/eventos", label: "Eventos", icon: Trophy },
  { href: "/cadastro", label: "Pre-matricula", icon: UserPlus },
  { href: "/produtos", label: "Produtos", icon: ShoppingBag },
  { href: "/criar-conta", label: "Criar conta", icon: Building2 },
]

export function PublicHeader({ subtitle }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/pagamentos" className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
              <Image src={brand.logoUrl} alt={brand.appName} width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{brand.appName}</p>
              {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-muted md:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-20 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-0 right-0 top-16 border-b bg-card shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="mx-auto max-w-lg space-y-1 px-4 py-3">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    pathname === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  )
}
