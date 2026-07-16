'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

// Error boundary para capturar erros de runtime nos componentes
// Sem isso, um único erro (ex: dado undefined) derruba a página inteira

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error boundary capturou:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Algo deu errado</h2>
        <p className="text-muted-foreground">
          Ocorreu um erro inesperado ao carregar o dashboard.
          Tente recarregar a página.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Erro ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  )
}