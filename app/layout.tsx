import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Tarik Tambang — Game',
  description: 'Game tarik-tambang sederhana, tanpa backend. Admin control & player UI.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
          <div className="max-w-6xl mx-auto p-6">{children}</div>
        </main>
      </body>
    </html>
  )
}
