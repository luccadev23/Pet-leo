import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input, Label } from '~/components/ui/form'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/entrar')({
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === 'string' ? search.from : undefined,
  }),
  component: Entrar,
})

function Entrar() {
  const navigate = useNavigate()
  const { from } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await authClient.signIn.email({ email, password })
    setLoading(false)
    if (authError) {
      setError('E-mail ou senha incorretos.')
      return
    }
    navigate({ to: from || '/painel' } as any)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <img src="/petlio-logo.png" alt="Petlio" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-semibold text-petlio-navy">Petlio</span>
        </Link>
        <h1 className="font-display text-2xl text-petlio-navy">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-petlio-navy/60">Entre para ver seus pets e agendamentos.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="default" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-petlio-navy/60">
          Ainda não tem conta? <Link to="/criar-conta" search={{ from }} className="font-semibold text-petlio-teal-600 hover:underline">Criar conta</Link>
        </p>
      </Card>
    </main>
  )
}
