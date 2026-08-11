import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { PawPrint, Plus, LogOut, Stethoscope } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { getDashboardData, logOut } from '~/server/functions'

export const Route = createFileRoute('/painel')({
  loader: async () => {
    const data = await getDashboardData()
    if (!data) throw redirect({ to: '/entrar' })
    return data
  },
  component: Painel,
})

const categoryLabels: Record<string, string> = {
  PASSEADOR: 'Passeador',
  VETERINARIO: 'Veterinário',
  PET_SITTER: 'Pet Sitter',
  TRANSPORTE: 'Transporte',
  PET_SHOP: 'Pet Shop',
  CLINICA: 'Clínica',
}

function Painel() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()

  async function handleLogout() {
    await logOut()
    navigate({ to: '/' })
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-petlio-teal-50 text-petlio-teal-600">
                      <PawPrint className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-petlio-navy">{pet.name}</div>
                      <div className="text-xs text-petlio-navy/55">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</div>
                    </div>
                  </div>
                  {pet.notes && <p className="mt-3 text-xs text-petlio-navy/60">{pet.notes}</p>}
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-petlio-gold/20 text-petlio-gold-dark">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-petlio-navy">
                    {categoryLabels[data.providerProfile.category] ?? data.providerProfile.category}
                  </div>
                  <div className="text-xs text-petlio-navy/55">
                    ⭐ {data.providerProfile.ratingAvg ?? 0} · {data.providerProfile.ratingCount ?? 0} avaliações
                  </div>
                </div>
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
      </div>
    </main>
  )
}
