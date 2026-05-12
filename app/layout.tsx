import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ALAMAH PMS — Enterprise Performance Management',
  description: 'ALAMAH Performance Management System — enterprise-grade performance management for modern organisations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
