import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PawPrint, Star, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Label, Select, Textarea } from '~/components/ui/form'
import { getProviderDetail, getMyPets, createBooking, getSessionUser } from '~/server/functions'

export const Route = createFileRoute('/agendar/$providerId')({
  beforeLoad: async ({ location }) => {
    const user = await getSessionUser()
    if (!user) throw redirect({ to: '/entrar', search: { from: location.href } as any })
  },
  loader: async ({ params }) => {
    const [provider, myPets] = await Promise.all([
      getProviderDetail({ data: { providerId: params.providerId } }),
      getMyPets(),
    ])
    return { provider, myPets }
  },
  component: Agendar,
})

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function Agendar() {
  const { provider, myPets } = Route.useLoaderData()
  const params = Route.useParams()
  const navigate = useNavigate()

  const [petId, setPetId] = useState(myPets[0]?.id ?? '')
  const [serviceId, setServiceId] = useState(provider.services[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!petId) return setError('Selecione um pet.')
    if (!serviceId) return setError('Selecione um serviço.')
    if (!date || !time) return setError('Escolha a data e o horário completos.')

    const scheduled = new Date(`${date}T${time}`)
    if (Number.isNaN(scheduled.getTime())) return setError('Data ou horário inválidos.')
    if (scheduled.getTime() < Date.now()) return setError('Escolha uma data e horário futuros.')

    setLoading(true)
    try {
      await createBooking({
        data: {
          providerId: provider.id,
          serviceId,
          petId,
          scheduledAt: scheduled.toISOString(),
          notes: notes || undefined,
        },
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível confirmar o agendamento.')
    } finally {
      setLoading(false)
    }
  }

  if (myPets.length === 0) {
    return (
      <main className="flex min-h-screen justify-center px-6 py-16">
        <Card className="w-full max-w-lg p-8 text-center">
          <PawPrint className="mx-auto h-8 w-8 text-petlio-teal-200" />
          <h1 className="mt-4 font-display text-2xl text-petlio-navy">Cadastre um pet primeiro</h1>
          <p className="mt-2 text-sm text-petlio-navy/60">
            Para agendar com {provider.name}, a gente precisa saber para qual pet é o atendimento.
          </p>
          <Link to="/cadastrar-pet" search={{ from: `/agendar/${params.providerId}` }}>
            <Button variant="gold" size="lg" className="mt-6 w-full">Cadastrar meu pet</Button>
          </Link>
        </Card>
      </main>
    )
  }

  if (provider.services.length === 0) {
    return (
      <main className="flex min-h-screen justify-center px-6 py-16">
        <Card className="w-full max-w-lg p-8 text-center">
          <PawPrint className="mx-auto h-8 w-8 text-petlio-teal-200" />
          <h1 className="mt-4 font-display text-2xl text-petlio-navy">Sem serviços disponíveis</h1>
          <p className="mt-2 text-sm text-petlio-navy/60">
            {provider.name} ainda não cadastrou serviços para agendamento.
          </p>
          <Link to="/painel"><Button variant="outline" size="lg" className="mt-6 w-full">Voltar ao painel</Button></Link>
        </Card>
      </main>
    )
  }

  if (done) {
    return (
      <main className="flex min-h-screen justify-center px-6 py-16">
        <Card className="w-full max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-petlio-teal-600" />
          <h1 className="mt-4 font-display text-2xl text-petlio-navy">Agendamento solicitado!</h1>
          <p className="mt-2 text-sm text-petlio-navy/60">
            Você vai receber uma confirmação de {provider.name} pelo painel.
          </p>
          <Link to="/painel"><Button variant="gold" size="lg" className="mt-6 w-full">Ver meus agendamentos</Button></Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen justify-center px-6 py-16">
      <Card className="w-full max-w-lg p-8">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <img src="/petlio-logo.png" alt="Petlio" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-semibold text-petlio-navy">Petlio</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-petlio-teal-50 text-petlio-teal-600">
            {provider.avatarUrl ? (
              <img src={`/api/img/${provider.avatarUrl}`} alt={provider.name} className="h-full w-full object-cover" />
            ) : (
              <PawPrint className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-petlio-navy">
              {provider.name}
              {provider.verified && <ShieldCheck className="h-3.5 w-3.5 text-petlio-teal-600" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-petlio-navy/55">
              <Star className="h-3.5 w-3.5 text-petlio-gold-dark" />
              {(provider.ratingAvg ?? 0).toFixed(1)} · {provider.ratingCount ?? 0} avaliações
            </div>
          </div>
        </div>

        <h1 className="mt-6 font-display text-2xl text-petlio-navy">Agendar serviço</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="pet">Pet</Label>
            <Select id="pet" value={petId} onChange={(e) => setPetId(e.target.value)}>
              {myPets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="service">Serviço</Label>
            <Select id="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {provider.services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {formatPrice(s.priceCents)} · {s.durationMinutes}min</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={todayLocal()}
                required
                className="h-11 w-full rounded-xl border border-petlio-teal-200 bg-white px-4 text-sm text-petlio-ink outline-none transition-colors focus:border-petlio-teal-600 focus:ring-2 focus:ring-petlio-teal-600/20"
              />
            </div>
            <div>
              <Label htmlFor="time">Horário</Label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-petlio-teal-200 bg-white px-4 text-sm text-petlio-ink outline-none transition-colors focus:border-petlio-teal-600 focus:ring-2 focus:ring-petlio-teal-600/20"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo que o profissional deveria saber antes do atendimento." />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Enviando...' : 'Confirmar agendamento'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
