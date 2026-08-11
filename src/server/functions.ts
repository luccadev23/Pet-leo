import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { user, pets, providerProfiles, services } from '~/db/schema'
import { getAuth } from '~/lib/auth-server'

function db() {
  return drizzle(env.DB as D1Database)
}

async function getCurrentUserRow() {
  const request = getRequest()
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) return null
  return session.user as typeof user.$inferSelect
}

export const getSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  const u = await getCurrentUserRow()
  if (!u) return null
  return { id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatarUrl }
})

// ---------------- PETS ----------------

export const createPet = createServerFn({ method: 'POST' })
  .validator(
    (d: {
      name: string
      species: string
      breed?: string
      sex?: 'MALE' | 'FEMALE' | 'UNKNOWN'
      weightKg?: number
      notes?: string
      allergies?: string
      photoKey?: string
    }) => d
  )
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')
    if (!data.name.trim()) throw new Error('Dê um nome para o seu pet.')
    if (!data.species.trim()) throw new Error('Informe a espécie do pet.')

    const id = crypto.randomUUID()
    await db().insert(pets).values({
      id,
      ownerId: u.id,
      name: data.name.trim(),
      species: data.species.trim(),
      breed: data.breed?.trim() || null,
      sex: data.sex ?? 'UNKNOWN',
      weightKg: data.weightKg ?? null,
      notes: data.notes?.trim() || null,
      allergies: data.allergies?.trim() || null,
      photoUrl: data.photoKey || null,
    })
    return { id }
  })

export const getPet = createServerFn({ method: 'GET' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')
    const rows = await db().select().from(pets).where(eq(pets.id, data.id))
    const pet = rows[0]
    if (!pet || pet.ownerId !== u.id) throw new Error('Pet não encontrado.')
    return pet
  })

export const updatePet = createServerFn({ method: 'POST' })
  .validator(
    (d: {
      id: string
      name: string
      species: string
      breed?: string
      sex?: 'MALE' | 'FEMALE' | 'UNKNOWN'
      weightKg?: number
      notes?: string
      allergies?: string
      photoKey?: string | null
    }) => d
  )
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')
    const rows = await db().select().from(pets).where(eq(pets.id, data.id))
    const pet = rows[0]
    if (!pet || pet.ownerId !== u.id) throw new Error('Pet não encontrado.')

    await db()
      .update(pets)
      .set({
        name: data.name.trim(),
        species: data.species.trim(),
        breed: data.breed?.trim() || null,
        sex: data.sex ?? 'UNKNOWN',
        weightKg: data.weightKg ?? null,
        notes: data.notes?.trim() || null,
        allergies: data.allergies?.trim() || null,
        photoUrl: data.photoKey === undefined ? pet.photoUrl : data.photoKey,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(pets.id, data.id))
    return { id: data.id }
  })

export const getMyPets = createServerFn({ method: 'GET' }).handler(async () => {
  const u = await getCurrentUserRow()
  if (!u) return []
  return db().select().from(pets).where(eq(pets.ownerId, u.id))
})

// ---------------- PROVIDERS ----------------

export const becomeProvider = createServerFn({ method: 'POST' })
  .validator(
    (d: {
      category: 'VETERINARIO' | 'PASSEADOR' | 'PET_SITTER' | 'TRANSPORTE' | 'PET_SHOP' | 'CLINICA'
      bio?: string
      photoKey?: string
    }) => d
  )
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')

    const existing = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
    if (existing[0]) throw new Error('Você já tem um perfil de profissional.')

    const id = crypto.randomUUID()
    await db().insert(providerProfiles).values({
      id,
      userId: u.id,
      category: data.category,
      bio: data.bio?.trim() || null,
    })
    await db()
      .update(user)
      .set({ role: 'PROVIDER', avatarUrl: data.photoKey || u.avatarUrl })
      .where(eq(user.id, u.id))
    return { id }
  })

export const updateProviderProfile = createServerFn({ method: 'POST' })
  .validator(
    (d: {
      category: 'VETERINARIO' | 'PASSEADOR' | 'PET_SITTER' | 'TRANSPORTE' | 'PET_SHOP' | 'CLINICA'
      bio?: string
      photoKey?: string | null
    }) => d
  )
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')

    const rows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
    const profile = rows[0]
    if (!profile) throw new Error('Perfil profissional não encontrado.')

    await db()
      .update(providerProfiles)
      .set({
        category: data.category,
        bio: data.bio?.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(providerProfiles.id, profile.id))

    if (data.photoKey !== undefined) {
      await db().update(user).set({ avatarUrl: data.photoKey }).where(eq(user.id, u.id))
    }
    return { id: profile.id }
  })

// ---------------- DASHBOARD ----------------

export const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  const u = await getCurrentUserRow()
  if (!u) return null

  const myPets = await db().select().from(pets).where(eq(pets.ownerId, u.id))

  let providerProfile: typeof providerProfiles.$inferSelect | null = null
  let myServices: (typeof services.$inferSelect)[] = []
  if (u.role === 'PROVIDER') {
    const rows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
    providerProfile = rows[0] ?? null
    if (providerProfile) {
      myServices = await db().select().from(services).where(eq(services.providerId, providerProfile.id))
    }
  }

  return {
    user: { id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatarUrl },
    pets: myPets,
    providerProfile,
    services: myServices,
  }
})
