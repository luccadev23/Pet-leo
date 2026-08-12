import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { PawPrint, Plus, LogOut, Stethoscope, CalendarCheck, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input, Label, Textarea } from '~/components/ui/form'
import {
  getDashboardData,
  getMyBookings,
  getReceivedBookings,
  createService,
  deleteService,
  updateBookingStatus,
} from '~/server/functions'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/painel')({
  loader: async () => {
    const data = await getDashboardData()
    if (!data) throw redirect({ to: '/entrar' })
    const [myBookings, receivedBookings] = await Promise.all([
      getMyBookings(),
      data.user.role === 'PROVIDER' ? getReceivedBookings() : Promise.resolve([]),
    ])
    return { ...data, myBookings, receivedBookings }
  },
  component: Painel,
})

const categoryLabels: Record<string, string> = {
  PASSEADOR: 'Passeador',
  VETERINARIO: 'Veterinário',
  PET_SITTER: 'Pet Sitter',
  TRANSPORTE: 'Transporte',
  PET_SHOP: 'Pet Shop',
  BANHO_TOSA: 'Banho e Tosa',
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Aguardando confirmação', className: 'bg-petlio-gold/20 text-petlio-gold-dark' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-petlio-teal-50 text-petlio-teal-600' },
  IN_PROGRESS: { label: 'Em andamento', className: 'bg-petlio-teal-50 text-petlio-teal-600' },
  COMPLETED: { label: 'Concluído', className: 'bg-petlio-navy/10 text-petlio-navy' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StatusBadge({ status }: { status: string }) {
  const s = statusLabels[status] ?? { label: status, className: 'bg-petlio-navy/10 text-petlio-navy' }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
}

function Painel() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut()
    navigate({ to: '/' })
  }

  async function handleBookingStatus(id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') {
    await updateBookingStatus({ data: { id, status } })
    router.invalidate()
  }

  return (
    <main className="min-h-screen bg-petlio-cream-dark">
      <header className="border-b border-petlio-teal-200/40 bg-petlio-cream">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/petlio-logo.png" alt="Petlio" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-semibold text-petlio-navy">Petlio</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl text-petlio-navy">Olá, {data.user.name.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-petlio-navy/60">
          {data.user.role === 'PROVIDER' ? 'Painel do profissional' : 'Seu painel de tutor'}
        </p>

        {/* Pets */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-petlio-navy">Meus pets</h2>
            <Link to="/cadastrar-pet">
              <Button variant="gold" size="sm"><Plus className="h-4 w-4" /> Cadastrar pet</Button>
            </Link>
          </div>
          {data.pets.length === 0 ? (
            <Card className="mt-4 p-8 text-center">
              <PawPrint className="mx-auto h-8 w-8 text-petlio-teal-200" />
              <p className="mt-2 text-sm text-petlio-navy/60">Você ainda não cadastrou nenhum pet.</p>
            </Card>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.pets.map((pet) => (
                <Card key={pet.id} className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-petlio-teal-50 text-petlio-teal-600">
                      {pet.photoUrl ? (
                        <img src={`/api/img/${pet.photoUrl}`} alt={pet.name} className="h-full w-full object-cover" />
                      ) : (
                        <PawPrint className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-petlio-navy">{pet.name}</div>
                      <div className="text-xs text-petlio-navy/55">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</div>
                    </div>
                    <Link to="/editar-pet/$petId" params={{ petId: pet.id }}>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </Link>
                  </div>
                  {pet.notes && <p className="mt-3 text-xs text-petlio-navy/60">{pet.notes}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Meus agendamentos (como tutor) */}
        <section className="mt-10">
          <h2 className="font-display text-xl text-petlio-navy">Meus agendamentos</h2>
          {data.myBookings.length === 0 ? (
            <Card className="mt-4 p-8 text-center">
              <CalendarCheck className="mx-auto h-8 w-8 text-petlio-teal-200" />
              <p className="mt-2 text-sm text-petlio-navy/60">Você ainda não tem agendamentos.</p>
            </Card>
          ) : (
            <div className="mt-4 space-y-3">
              {data.myBookings.map((b) => (
                <Card key={b.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-petlio-navy">{b.serviceName} · {b.petName}</div>
                      <div className="text-xs text-petlio-navy/55">
                        com {b.providerName} · {formatDate(b.scheduledAt)} · {formatPrice(b.priceCents)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} />
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <Button variant="ghost" size="sm" onClick={() => handleBookingStatus(b.id, 'CANCELLED')}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Provider profile */}
        <section className="mt-10">
          <h2 className="font-display text-xl text-petlio-navy">Perfil profissional</h2>
          {data.providerProfile ? (
            <Card className="mt-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-petlio-gold/20 text-petlio-gold-dark">
                  {data.user.avatarUrl ? (
                    <img src={`/api/img/${data.user.avatarUrl}`} alt={data.user.name} className="h-full w-full object-cover" />
                  ) : (
                    <Stethoscope className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-petlio-navy">
                    {categoryLabels[data.providerProfile.category] ?? data.providerProfile.category}
                  </div>
                  <div className="text-xs text-petlio-navy/55">
                    ⭐ {data.providerProfile.ratingAvg ?? 0} · {data.providerProfile.ratingCount ?? 0} avaliações
                  </div>
                </div>
                <Link to="/sou-profissional">
                  <Button variant="ghost" size="sm">Editar</Button>
                </Link>
              </div>
              {data.providerProfile.bio && <p className="mt-3 text-sm text-petlio-navy/70">{data.providerProfile.bio}</p>}
            </Card>
          ) : (
            <Card className="mt-4 p-8 text-center">
              <Stethoscope className="mx-auto h-8 w-8 text-petlio-teal-200" />
              <p className="mt-2 text-sm text-petlio-navy/60">Você ainda não oferece serviços na Petlio.</p>
              <Link to="/sou-profissional">
                <Button variant="outline" size="sm" className="mt-4">Tornar-se profissional</Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Meus serviços (somente profissional) */}
        {data.providerProfile && (
          <section className="mt-10">
            <h2 className="font-display text-xl text-petlio-navy">Meus serviços</h2>
            <p className="mt-1 text-sm text-petlio-navy/60">
              Cadastre os serviços que oferece — sem eles, tutores não conseguem agendar com você.
            </p>
            <ServiceManager services={data.services} onChange={() => router.invalidate()} />
          </section>
        )}

        {/* Agendamentos recebidos (somente profissional) */}
        {data.providerProfile && (
          <section className="mt-10">
            <h2 className="font-display text-xl text-petlio-navy">Agendamentos recebidos</h2>
            {data.receivedBookings.length === 0 ? (
              <Card className="mt-4 p-8 text-center">
                <CalendarCheck className="mx-auto h-8 w-8 text-petlio-teal-200" />
                <p className="mt-2 text-sm text-petlio-navy/60">Você ainda não recebeu solicitações de agendamento.</p>
              </Card>
            ) : (
              <div className="mt-4 space-y-3">
                {data.receivedBookings.map((b) => (
                  <Card key={b.id} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-petlio-navy">{b.serviceName} · {b.petName}</div>
                        <div className="text-xs text-petlio-navy/55">
                          tutor {b.clientName} · {formatDate(b.scheduledAt)} · {formatPrice(b.priceCents)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.status} />
                        {b.status === 'PENDING' && (
                          <>
                            <Button variant="gold" size="sm" onClick={() => handleBookingStatus(b.id, 'CONFIRMED')}>
                              Confirmar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleBookingStatus(b.id, 'CANCELLED')}>
                              Recusar
                            </Button>
                          </>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <Button variant="gold" size="sm" onClick={() => handleBookingStatus(b.id, 'COMPLETED')}>
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

function ServiceManager({
  services,
  onChange,
}: {
  services: { id: string; name: string; description: string | null; durationMinutes: number; priceCents: number; active: boolean | null }[]
  onChange: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createService({
        data: {
          name,
          description: description || undefined,
          durationMinutes: Number(durationMinutes) || 60,
          priceCents: Math.round(Number(price.replace(',', '.')) * 100),
        },
      })
      setName('')
      setDescription('')
      setDurationMinutes('60')
      setPrice('')
      setShowForm(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o serviço.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteService({ data: { id } })
    onChange()
  }

  return (
    <div className="mt-4 space-y-3">
      {services.map((s) => (
        <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="font-semibold text-petlio-navy">{s.name}</div>
            <div className="text-xs text-petlio-navy/55">
              {formatPrice(s.priceCents)} · {s.durationMinutes}min
              {s.description ? ` · ${s.description}` : ''}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}

      {showForm ? (
        <Card className="p-5">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="svc-name">Nome do serviço</Label>
              <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Passeio de 30 minutos" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="svc-duration">Duração (min)</Label>
                <Input id="svc-duration" type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="svc-price">Preço (R$)</Label>
                <Input id="svc-price" type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="45,00" required />
              </div>
            </div>
            <div>
              <Label htmlFor="svc-desc">Descrição (opcional)</Label>
              <Textarea id="svc-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="gold" size="sm" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar serviço'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      )}
    </div>
  )
}
