"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  ShoppingBag,
  UserCog,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react"
import { brand } from "@/branding/brand"
import { useSession } from "@/hooks/use-session"
import { logout } from "@/lib/supabase/actions"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MobileHeaderProps {
  title: string
  userName?: string
  userPapel?: "admin" | "professora"
}

type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  group?: "Geral" | "Gestao" | "Financeiro" | "Loja" | "Sistema"
}

const adminMenuItems: NavigationItem[] = [
  { label: "Dashboard", href: "/admin", group: "Geral", icon: LayoutDashboard },
  { label: "Polos", href: "/admin/polos", group: "Gestao", icon: MapPin },
  { label: "Locais", href: "/admin/locais", group: "Gestao", icon: MapPin },
  { label: "Turmas", href: "/admin/turmas", group: "Gestao", icon: GraduationCap },
  { label: "Alunas", href: "/admin/alunas", group: "Gestao", icon: Users },
  { label: "Professoras", href: "/admin/professoras", group: "Gestao", icon: UserRoundCheck },
  { label: "Financeiro", href: "/admin/financeiro", group: "Financeiro", icon: DollarSign },
  { label: "Cobrancas", href: "/admin/cobrancas", group: "Financeiro", icon: AlertCircle },
  { label: "Produtos", href: "/admin/produtos", group: "Loja", icon: ShoppingBag },
  { label: "Eventos", href: "/admin/eventos", group: "Loja", icon: CalendarDays },
  { label: "Usuarios", href: "/admin/usuarios", group: "Sistema", icon: UserCog },
  { label: "Configuracoes", href: "/admin/configuracoes", group: "Sistema", icon: Settings },
]

const professoraMenuItems: NavigationItem[] = [
  { label: "Dashboard", href: "/professora", icon: LayoutDashboard },
  { label: "Minhas Turmas", href: "/professora/turmas", icon: GraduationCap },
  { label: "Minhas Alunas", href: "/professora/alunas", icon: Users },
  { label: "Chamadas", href: "/professora/chamadas", icon: CalendarDays },
  { label: "Financeiro", href: "/professora/financeiro", icon: CreditCard },
]

const adminGroups: NonNullable<NavigationItem["group"]>[] = ["Geral", "Gestao", "Financeiro", "Loja", "Sistema"]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function BrandBlock({ compact = false, subtitle }: { compact?: boolean; subtitle: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground",
          compact ? "size-9" : "size-11",
        )}
      >
        <Image src={brand.logoUrl} alt={brand.appName} width={44} height={44} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <p className={cn("truncate font-semibold leading-tight", compact ? "text-sm" : "text-lg")}>
          {compact ? brand.shortName : brand.appName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavigationItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex w-full gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" />
      {item.label}
    </Link>
  )
}

function NavList({
  isAdmin,
  pathname,
  onNavigate,
}: {
  isAdmin: boolean
  pathname: string
  onNavigate: () => void
}) {
  if (!isAdmin) {
    return (
      <ul className="flex flex-1 flex-col gap-y-2">
        {professoraMenuItems.map((item) => (
          <li key={item.href}>
            <NavLink item={item} active={isActivePath(pathname, item.href)} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      {adminGroups.map((group) => {
        const items = adminMenuItems.filter((item) => item.group === group)
        if (!items.length) return null

        return (
          <div key={group}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase text-muted-foreground">{group}</p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActivePath(pathname, item.href)} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function MobileHeader({ title, userName: userNameProp, userPapel: userPapelProp }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const session = useSession()
  const userName = userNameProp ?? session.userName
  const userPapel = userPapelProp ?? session.userPapel
  const isAdmin = userPapel === "admin"
  const subtitle = isAdmin ? "Painel administrativo" : "Painel da professora"
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      <header
        className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-card px-4"
        aria-label={title}
      >
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir navegacao">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navegacao</SheetTitle>
              <SheetDescription>Navegacao principal da aplicacao.</SheetDescription>
            </SheetHeader>

            <div className="flex h-16 shrink-0 items-center border-b px-6">
              <BrandBlock subtitle={subtitle} />
            </div>

            <div className="border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {isAdmin ? "Administrador" : "Professora"}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <NavList isAdmin={isAdmin} pathname={pathname} onNavigate={closeMenu} />

              <form action={logout} className="mt-4">
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="size-5 shrink-0" />
                  Sair
                </Button>
              </form>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <BrandBlock compact subtitle={subtitle} />
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {userName.charAt(0).toUpperCase()}
        </div>
      </header>
    </>
  )
}
