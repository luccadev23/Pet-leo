import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  PawPrint, Stethoscope, Home as HomeIcon, Car, Scissors, ShoppingBag,
  Star, ShieldCheck, ArrowLeft,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { getProvidersByCategory } from '~/server/functions'

type Category = 'PASSEADOR' | 'VETERINARIO' | 'PET_SITTER' | 'TRANSPORTE' | 'BANHO_TOSA' | 'PET_SHOP'

const categoryInfo: Record<Category, { icon: typeof PawPrint; label: string; desc: string }> = {
  PASSEADOR: { icon: PawPrint, label: 'Passeador', desc: 'Passeios individuais ou em grupo' },
  VETERINARIO: { icon: Stethoscope, label: 'Veterinário', desc: 'Consultas e vacinação' },
  PET_SITTER: { icon: HomeIcon, label: 'Pet Sitter', desc: 'Cuidado na casa do seu pet' },
  TRANSPORTE: { icon: Car, label: 'Transporte', desc: 'Leva e busca com segurança' },
  BANHO_TOSA: { icon: Scissors, label: 'Banho e Tosa', desc: 'Higiene e estética' },
  PET_SHOP: { icon: ShoppingBag, label: 'Pet Shop', desc: 'Produtos selecionados' },
}

function isCategory(value: string): value is Category {
  return value in categoryInfo
}

export const Route = createFileRoute('/servicos/$category')({
  loader: async ({ params }) => {
    if (!isCategory(params.category)) throw notFound()
    const providers = await getProvidersByCategory({ data: { category: params.category } })
    return { category: params.category, providers }
  },
  component: CategoryPage,
})

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function CategoryPage() {
  const { category, providers } = Route.useLoaderData()
  const { icon: Icon, label, desc } = categoryInfo[category]

  return (
    <main className="min-h-screen bg-petlio-cream-dark">
      <header className="border-b border-petlio-teal-200/40 bg-petlio-cream">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/petlio-logo.png" alt="Petlio" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-semibold text-petlio-navy">Petlio</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-petlio-navy/70 hover:text-petlio-navy">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-petlio-gold/20 text-petlio-gold-dark">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-petlio-navy">{label}</h1>
            <p className="text-petlio-navy/60">{desc}</p>
          </div>
        </div>

        <section className="mt-8">
          {providers.length === 0 ? (
            <Card className="p-10 text-center">
              <Icon className="mx-auto h-8 w-8 text-petlio-teal-200" />
              <p className="mt-3 text-sm text-petlio-navy/60">
                Ainda não temos profissionais de {label.toLowerCase()} cadastrados nessa região.
              </p>
              <Link to="/sou-profissional">
                <Button variant="outline" size="sm" className="mt-4">Quero oferecer esse serviço</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {providers.map((p) => (
                <Card key={p.id} className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-petlio-teal-50 text-petlio-teal-600">
                      {p.avatarUrl ? (
                        <img src={`/api/img/${p.avatarUrl}`} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-semibold text-petlio-navy">
                        {p.name}
                        {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-petlio-teal-600" />}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-petlio-navy/55">
                        <Star className="h-3.5 w-3.5 text-petlio-gold-dark" />
                        {(p.ratingAvg ?? 0).toFixed(1)} · {p.ratingCount ?? 0} avaliações
                      </div>
                    </div>
                  </div>

                  {p.bio && <p className="mt-3 text-sm text-petlio-navy/70">{p.bio}</p>}

                  {p.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.services.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-full bg-petlio-teal-50 px-3 py-1 text-xs font-medium text-petlio-teal-600"
                        >
                          {s.name} · {formatPrice(s.priceCents)}
                        </span>
                      ))}
                    </div>
                  )}

                  {p.services.length > 0 ? (
                    <Link to="/agendar/$providerId" params={{ providerId: p.id }}>
                      <Button variant="gold" size="sm" className="mt-4 w-full">Solicitar agendamento</Button>
                    </Link>
                  ) : (
                    <Button variant="gold" size="sm" className="mt-4 w-full" disabled>
                      Sem serviços cadastrados
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
