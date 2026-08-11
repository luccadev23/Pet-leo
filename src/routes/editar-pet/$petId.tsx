import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PawPrint } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input, Label, Select, Textarea } from '~/components/ui/form'
import { ImageUploadField } from '~/components/image-upload-field'
import { getPet, updatePet, getSessionUser } from '~/server/functions'

export const Route = createFileRoute('/editar-pet/$petId')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (!user) throw redirect({ to: '/entrar' })
  },
  loader: async ({ params }) => getPet({ data: { id: params.petId } }),
  component: EditarPet,
})

function EditarPet() {
  const pet = Route.useLoaderData()
  const navigate = useNavigate()
  const [name, setName] = useState(pet.name)
  const [species, setSpecies] = useState(pet.species)
  const [breed, setBreed] = useState(pet.breed ?? '')
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'UNKNOWN'>((pet.sex as any) ?? 'UNKNOWN')
  const [weightKg, setWeightKg] = useState(pet.weightKg?.toString() ?? '')
  const [allergies, setAllergies] = useState(pet.allergies ?? '')
  const [notes, setNotes] = useState(pet.notes ?? '')
  const [photoKey, setPhotoKey] = useState<string | null>(pet.photoUrl)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await updatePet({
        data: {
          id: pet.id,
          name,
          species,
          breed: breed || undefined,
          sex,
          weightKg: weightKg ? Number(weightKg) : undefined,
          allergies: allergies || undefined,
          notes: notes || undefined,
          photoKey,
        },
      })
      navigate({ to: '/painel' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar as alterações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen justify-center px-6 py-16">
      <Card className="w-full max-w-lg p-8">
        <Link to="/painel" className="mb-6 flex items-center gap-2">
          <img src="/petlio-logo.png" alt="Petlio" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-semibold text-petlio-navy">Petlio</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-petlio-gold/20 px-3 py-1 text-xs font-semibold text-petlio-gold-dark">
          <PawPrint className="h-3.5 w-3.5" /> Editar pet
        </span>
        <h1 className="mt-4 font-display text-2xl text-petlio-navy">Editar {pet.name}</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <ImageUploadField value={photoKey} onChange={setPhotoKey} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
              <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} />
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
            <Input id="weight" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="allergies">Alergias / medicamentos</Label>
            <Textarea id="allergies" rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="notes">Observações importantes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
