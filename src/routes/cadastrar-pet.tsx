import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PawPrint, Camera } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input, Label, Select, Textarea } from '~/components/ui/form'
import { createPet, getSessionUser } from '~/server/functions'

export const Route = createFileRoute('/cadastrar-pet')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (!user) {
      throw redirect({ to: '/entrar' })
    }
  },
  component: CadastrarPet,
})

function CadastrarPet() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('Cachorro')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'UNKNOWN'>('UNKNOWN')
  const [weightKg, setWeightKg] = useState('')
  const [allergies, setAllergies] = useState('')
  const [notes, setNotes] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
  }

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
        },
      })
      navigate({ to: '/painel' })
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
          <div className="flex items-center gap-4">
            <label className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-petlio-teal-200 bg-petlio-teal-50 text-petlio-teal-600">
              {photoPreview ? (
                <img src={photoPreview} alt="Foto do pet" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
            </label>
            <p className="text-xs text-petlio-navy/50">
              Foto do pet (opcional nesta versão de demonstração — o upload real de arquivo entra na próxima etapa).
            </p>
          </div>

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
