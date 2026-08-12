import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Stethoscope } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Label, Select, Textarea } from '~/components/ui/form'
import { ImageUploadField } from '~/components/image-upload-field'
import { becomeProvider, updateProviderProfile, getDashboardData } from '~/server/functions'

export const Route = createFileRoute('/sou-profissional')({
  beforeLoad: async ({ location }) => {
    const data = await getDashboardData()
    if (!data) throw redirect({ to: '/criar-conta', search: { from: location.pathname } as any })
  },
  loader: async () => getDashboardData(),
  component: SouProfissional,
})

const categories = [
  { value: 'PASSEADOR', label: 'Passeador' },
  { value: 'VETERINARIO', label: 'Veterinário' },
  { value: 'PET_SITTER', label: 'Pet Sitter' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'PET_SHOP', label: 'Pet Shop' },
  { value: 'BANHO_TOSA', label: 'Banho e Tosa' },
] as const

function SouProfissional() {
  const data = Route.useLoaderData()
  const existing = data?.providerProfile ?? null
  const navigate = useNavigate()
  const [category, setCategory] = useState<(typeof categories)[number]['value']>(
    (existing?.category as any) ?? 'PASSEADOR'
  )
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [photoKey, setPhotoKey] = useState<string | null>(data?.user.avatarUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (existing) {
        await updateProviderProfile({ data: { category, bio, photoKey } })
      } else {
        await becomeProvider({ data: { category, bio, photoKey: photoKey || undefined } })
      }
      navigate({ to: '/painel' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar seu perfil profissional.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen justify-center px-6 py-16">
      <Card className="w-full max-w-lg p-8">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <img src="/petlio-logo.png" alt="Petlio" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-semibold text-petlio-navy">Petlio</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-petlio-teal-50 px-3 py-1 text-xs font-semibold text-petlio-teal-600">
          <Stethoscope className="h-3.5 w-3.5" /> {existing ? 'Editar perfil profissional' : 'Perfil profissional'}
        </span>
        <h1 className="mt-4 font-display text-2xl text-petlio-navy">
          {existing ? 'Atualize seu perfil' : 'Ofereça seus serviços na Petlio'}
        </h1>
        <p className="mt-1 text-sm text-petlio-navy/60">
          {existing ? 'Foto, categoria e descrição do seu atendimento.' : 'Escolha sua categoria principal — dá para ajustar depois.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <ImageUploadField value={photoKey} onChange={setPhotoKey} />

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="bio">Sobre você / seu negócio</Label>
            <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sua experiência, diferenciais e forma de atendimento." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="default" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Salvando...' : existing ? 'Salvar alterações' : 'Criar perfil profissional'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
