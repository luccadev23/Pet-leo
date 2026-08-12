import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PawPrint } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input, Label, Select, Textarea } from '~/components/ui/form'
import { ImageUploadField } from '~/components/image-upload-field'
import { createPet, getSessionUser } from '~/server/functions'

export const Route = createFileRoute('/cadastrar-pet')({
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === 'string' ? search.from : undefined,
  }),
  beforeLoad: async ({ location }) => {
    const user = await getSessionUser()
    if (!user) {
      throw redirect({ to: '/entrar', search: { from: location.href } as any })
    }
  },
  component: CadastrarPet,
})

function CadastrarPet() {
  const navigate = useNavigate()
  const { from } = Route.useSearch()
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('Cachorro')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'UNKNOWN'>('UNKNOWN')
  const [weightKg, setWeightKg] = useState('')
  const [allergies, setAllergies] = useState('')
  const [notes, setNotes] = useState('')
  const [photoKey, setPhotoKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createPet({
        data: {
          name,
          species,
          breed: breed || undefined,
          sex,
          weightKg: weightKg ? Number(weightKg) : undefined,
          allergies: allergies || undefined,
          notes: notes || undefined,
          photoKey: photoKey || undefined,
        },
      })
      navigate({ to: from || '/painel' } as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o pet.')
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-petlio-gold/20 px-3 py-1 text-xs font-semibold text-petlio-gold-dark">
          <PawPrint className="h-3.5 w-3.5" /> Novo pet
        </span>
        <h1 className="mt-4 font-display text-2xl text-petlio-navy">Conte sobre o seu pet</h1>
        <p className="mt-1 text-sm text-petlio-navy/60">Essas informações ajudam os profissionais a cuidar melhor dele.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <ImageUploadField value={photoKey} onChange={setPhotoKey} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Thor" required />
            </div>
            <div>
              <Label htmlFor="species">Espécie</Label>
              <Select id="species" value={species} onChange={(e) => setSpecies(e.target.value)}>
                <option>Cachorro</option>
                <option>Gato</option>
                <option>Ave</option>
                <option>Outro</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breed">Raça</Label>
              <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Golden Retriever" />
            </div>
            <div>
              <Label htmlFor="sex">Sexo</Label>
              <Select id="sex" value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}>
                <option value="UNKNOWN">Não informado</option>
                <option value="MALE">Macho</option>
                <option value="FEMALE">Fêmea</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input id="weight" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="28" />
          </div>

          <div>
            <Label htmlFor="allergies">Alergias / medicamentos</Label>
            <Textarea id="allergies" rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Nenhuma" />
          </div>

          <div>
            <Label htmlFor="notes">Observações importantes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Precisa de atenção com a pata traseira." />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar pet'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
