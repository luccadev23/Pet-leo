import { createFileRoute, Link } from '@tanstack/react-router'
import {
  PawPrint, Stethoscope, Home as HomeIcon, Car, Scissors, ShoppingBag,
  Search, CalendarCheck, MessageCircle, Star, MapPin, ShieldCheck,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { getSessionUser } from '~/server/functions'

export const Route = createFileRoute('/')({
  loader: async () => getSessionUser(),
  component: Home,
})

const categories = [
  { icon: PawPrint, label: 'Passeador', desc: 'Passeios individuais ou em grupo', slug: 'PASSEADOR' },
  { icon: Stethoscope, label: 'Veterinário', desc: 'Consultas e vacinação', slug: 'VETERINARIO' },
  { icon: HomeIcon, label: 'Pet Sitter', desc: 'Cuidado na casa do seu pet', slug: 'PET_SITTER' },
  { icon: Car, label: 'Transporte', desc: 'Leva e busca com segurança', slug: 'TRANSPORTE' },
  { icon: Scissors, label: 'Banho e Tosa', desc: 'Higiene e estética', slug: 'BANHO_TOSA' },
  { icon: ShoppingBag, label: 'Pet Shop', desc: 'Produtos selecionados', slug: 'PET_SHOP' },
] as const

const faturamento = [
  { ano: '2023', valor: 69.5 },
  { ano: '2024', valor: 75.4 },
  { ano: '2025', valor: 77.96 },
  { ano: '2026*', valor: 81.24 },
]

const segmentos = [
  { nome: 'Pet Food', valor: 40.8, color: '#1B6B7A' },
  { nome: 'Criadores', valor: 8.1, color: '#2E8C93' },
  { nome: 'Pet Vet', valor: 7.8, color: '#E0A94E' },
  { nome: 'Serv. Veterinários', valor: 7.7, color: '#C58A2E' },
  { nome: 'Outros serviços', valor: 10.9, color: '#D97757' },
]

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="font-display text-4xl sm:text-5xl text-petlio-navy font-semibold tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-sm text-petlio-navy/60 max-w-[16ch] mx-auto sm:mx-0">{label}</div>
    </div>
  )
}

function Home() {
  const user = Route.useLoaderData()
  return (
    <main className="min-h-screen">
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-30 border-b border-petlio-teal-200/40 bg-petlio-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <img src="/petlio-logo.png" alt="Petlio" className="h-10 w-10 object-contain" />
            <span className="font-display text-xl font-semibold text-petlio-navy">Petlio</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-petlio-navy/80">
            <a href="#servicos" className="hover:text-petlio-navy">Serviços</a>
            <a href="#mercado" className="hover:text-petlio-navy">O mercado</a>
            <a href="#como-funciona" className="hover:text-petlio-navy">Como funciona</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/painel" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-petlio-teal-50">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-petlio-teal-600 text-xs font-bold text-petlio-cream">
                  {user.avatarUrl ? (
                    <img src={`/api/img/${user.avatarUrl}`} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                  )}
                </span>
                <span className="hidden text-sm font-medium text-petlio-navy sm:inline">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <>
                <Link to="/entrar"><Button variant="ghost" size="sm">Entrar</Button></Link>
                <Link to="/criar-conta"><Button variant="default" size="sm">Criar conta</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-16 pb-20 md:grid-cols-2 md:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-petlio-teal-50 px-3 py-1 text-xs font-semibold text-petlio-teal-600 ring-1 ring-petlio-teal-200">
              <PawPrint className="h-3.5 w-3.5" /> Tudo para o seu pet, em um só lugar
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-petlio-navy sm:text-6xl">
              Encontre quem cuida do seu pet como você cuidaria.
            </h1>
            <p className="mt-5 max-w-md text-lg text-petlio-navy/70">
              Passeador, veterinário, pet sitter, transporte e banho &amp; tosa —
              busque, converse e agende com profissionais avaliados perto de você.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/cadastrar-pet"><Button size="lg" variant="gold" className="w-full sm:w-auto">Cadastrar meu pet</Button></Link>
              <Link to="/sou-profissional"><Button size="lg" variant="outline" className="w-full sm:w-auto">Sou profissional</Button></Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-petlio-navy/60">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-petlio-teal-600" /> Profissionais verificados</div>
              <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-petlio-gold-dark" /> Avaliados por tutores reais</div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-8 -z-10 rounded-full bg-petlio-teal-200/25 blur-3xl" />
            <img
              src="/petlio-logo.png"
              alt="Petlio — Serviços completos para pets"
              className="w-full rotate-[-4deg] drop-shadow-[0_20px_40px_rgba(13,59,74,0.18)] transition-transform duration-500 hover:rotate-0"
            />
            <div className="paw-divider absolute -bottom-6 left-1/2 h-16 w-40 -translate-x-1/2 opacity-70" />
          </div>
        </div>
      </section>

      {/* ---------------- CATEGORIES ---------------- */}
      <section id="servicos" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl text-petlio-navy">O que você procura hoje?</h2>
        <p className="mt-2 text-petlio-navy/60">Seis categorias, um único agendamento.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ icon: Icon, label, desc, slug }) => (
            <Link key={label} to="/servicos/$category" params={{ category: slug }}>
              <Card className="group cursor-pointer p-5 transition-transform hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-petlio-gold/20 text-petlio-gold-dark transition-colors group-hover:bg-petlio-gold group-hover:text-petlio-navy-900">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-4 font-semibold text-petlio-navy">{label}</div>
                <div className="mt-1 text-xs text-petlio-navy/55">{desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- MARKET / STATS ---------------- */}
      <section id="mercado" className="bg-petlio-navy py-20 text-petlio-cream">
        <div className="mx-auto max-w-6xl px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-petlio-gold">
            Por que Petlio, por que agora
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">O mercado pet nunca cresceu tanto</h2>
          <p className="mt-3 max-w-2xl text-petlio-cream/70">
            O setor pet brasileiro está entre os mais resilientes da economia — e os
            serviços, não os produtos, são a fronteira de crescimento mais rápida.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            <Stat value="R$ 81,2 bi" label="faturamento do setor pet projetado para 2026" />
            <Stat value="166,8 mi" label="animais de estimação no Brasil — 3º maior mercado do mundo" />
            <Stat value="84%" label="dos tutores consideram o pet parte da família" />
            <Stat value="65%" label="dos tutores dizem investir o que for preciso no pet" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="col-span-3 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
              <h3 className="font-display text-lg text-petlio-cream">Faturamento do setor pet no Brasil</h3>
              <p className="text-xs text-petlio-cream/50">Em bilhões de reais · fonte: Abinpet/Abempet</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={faturamento} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(251,247,239,0.1)" vertical={false} />
                    <XAxis dataKey="ano" stroke="rgba(251,247,239,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(251,247,239,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0D3B4A', border: '1px solid rgba(251,247,239,0.15)', borderRadius: 12, color: '#FBF7EF' }}
                      formatter={(v: number) => [`R$ ${v} bi`, 'Faturamento']}
                    />
                    <Bar dataKey="valor" fill="#E0A94E" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="col-span-2 bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
              <h3 className="font-display text-lg text-petlio-cream">Faturamento por segmento (2024)</h3>
              <p className="text-xs text-petlio-cream/50">Em bilhões de reais · fonte: Abempet</p>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={segmentos} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {segmentos.map((s) => <Cell key={s.nome} fill={s.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0D3B4A', border: '1px solid rgba(251,247,239,0.15)', borderRadius: 12, color: '#FBF7EF' }}
                      formatter={(v: number, n: string) => [`R$ ${v} bi`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-petlio-cream/70">
                {segmentos.map((s) => (
                  <li key={s.nome} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.nome}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <p className="mt-6 text-xs text-petlio-cream/40">
            *Projeção. Fontes: Abinpet, Abempet, Instituto Pet Brasil, Opinion Box (2025–2026). Números de mercado gerais; não representam dados internos do Petlio.
          </p>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl text-petlio-navy">Do cadastro ao carinho, em quatro passos</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: PawPrint, step: '1', title: 'Cadastre seu pet', text: 'Foto, raça, peso, alergias e observações importantes.' },
            { icon: Search, step: '2', title: 'Encontre um profissional', text: 'Filtre por categoria, distância, preço e avaliação.' },
            { icon: CalendarCheck, step: '3', title: 'Agende o serviço', text: 'Escolha data, horário e confirme com um toque.' },
            { icon: MessageCircle, step: '4', title: 'Acompanhe e avalie', text: 'Converse pelo chat e avalie ao final do atendimento.' },
          ].map(({ icon: Icon, step, title, text }) => (
            <div key={step} className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-petlio-navy text-petlio-cream">
                <Icon className="h-6 w-6" />
              </div>
              <span className="absolute -top-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-petlio-gold text-xs font-bold text-petlio-navy-900">
                {step}
              </span>
              <h3 className="mt-4 font-semibold text-petlio-navy">{title}</h3>
              <p className="mt-1 text-sm text-petlio-navy/60">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-petlio-teal-200/40 bg-petlio-cream-dark">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/petlio-logo.png" alt="Petlio" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-semibold text-petlio-navy">Petlio</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-petlio-navy/60">
            <MapPin className="h-4 w-4" /> Feito com carinho para tutores e seus pets.
          </div>
        </div>
      </footer>
    </main>
  )
}
