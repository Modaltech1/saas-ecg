import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { brand } from "@/branding/brand"
import "./globals.css"

export const metadata: Metadata = {
  title: brand.appName,
  description: brand.description,
  generator: "Prodexy",
  applicationName: brand.appName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.shortName,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: brand.faviconUrl,
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        url: brand.faviconUrl,
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
    apple: brand.faviconUrl,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: brand.themeColor,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
