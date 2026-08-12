import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PawPrint } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input, Label } from '~/components/ui/form'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/criar-conta')({
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === 'string' ? search.from : undefined,
  }),
  component: CriarConta,
})

function CriarConta() {
  const navigate = useNavigate()
  const { from } = Route.useSearch()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await authClient.signUp.email({ name, email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message ?? 'Não foi possível criar sua conta.')
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-petlio-teal-50 px-3 py-1 text-xs font-semibold text-petlio-teal-600">
          <PawPrint className="h-3.5 w-3.5" /> Criar conta de tutor
        </span>
        <h1 className="mt-4 font-display text-2xl text-petlio-navy">Vamos cuidar do seu pet</h1>
        <p className="mt-1 text-sm text-petlio-navy/60">Leva menos de um minuto.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar minha conta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-petlio-navy/60">
          Já tem conta? <Link to="/entrar" search={{ from }} className="font-semibold text-petlio-teal-600 hover:underline">Entrar</Link>
        </p>
        <p className="mt-2 text-center text-sm text-petlio-navy/60">
          É um profissional? <Link to="/sou-profissional" className="font-semibold text-petlio-teal-600 hover:underline">Cadastre seus serviços</Link>
        </p>
      </Card>
    </main>
  )
}
