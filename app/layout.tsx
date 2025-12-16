import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Tarik Tambang — Game',
  description: 'Game tarik-tambang sederhana, tanpa backend. Admin control & player UI.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Rubik:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <main className="min-h-[100dvh] relative">
          <div className="max-w-7xl mx-auto px-3 py-4 sm:p-4 md:p-6 relative z-10">{children}</div>
        </main>
      </body>
    </html>
  )
}
