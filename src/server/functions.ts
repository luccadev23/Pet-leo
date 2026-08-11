import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { users, pets, providerProfiles, sessions, services } from '~/db/schema'
import { hashPassword, verifyPassword } from '~/lib/auth'

const SESSION_COOKIE = 'petlio_session'

function db() {
  return drizzle(env.DB as D1Database)
}

async function createSessionCookie(userId: string) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await db().insert(sessions).values({ id: token, userId, expiresAt })
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
}

async function getCurrentUserRow() {
  const token = getCookie(SESSION_COOKIE)
  if (!token) return null
  const sessionRows = await db().select().from(sessions).where(eq(sessions.id, token))
  const session = sessionRows[0]
  if (!session || new Date(session.expiresAt) < new Date()) return null
  const userRows = await db().select().from(users).where(eq(users.id, session.userId))
  return userRows[0] ?? null
}

// ---------------- AUTH ----------------

export const signUp = createServerFn({ method: 'POST' })
  .validator((d: { name: string; email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase()
    if (!data.name.trim()) throw new Error('Informe seu nome.')
    if (!email.includes('@')) throw new Error('E-mail inválido.')
    if (data.password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')

    const existing = await db().select().from(users).where(eq(users.email, email))
    if (existing[0]) throw new Error('Já existe uma conta com esse e-mail.')

    const passwordHash = await hashPassword(data.password)
    const id = crypto.randomUUID()
    await db().insert(users).values({
      id,
      name: data.name.trim(),
      email,
      passwordHash,
      role: 'CLIENT',
    })
    await createSessionCookie(id)
    return { id, name: data.name.trim(), role: 'CLIENT' as const }
  })

export const logIn = createServerFn({ method: 'POST' })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase()
    const rows = await db().select().from(users).where(eq(users.email, email))
    const user = rows[0]
    if (!user) throw new Error('E-mail ou senha incorretos.')
    const ok = await verifyPassword(data.password, user.passwordHash)
    if (!ok) throw new Error('E-mail ou senha incorretos.')
    await createSessionCookie(user.id)
    return { id: user.id, name: user.name, role: user.role }
  })

export const logOut = createServerFn({ method: 'POST' }).handler(async () => {
  const token = getCookie(SESSION_COOKIE)
  if (token) {
    await db().delete(sessions).where(eq(sessions.id, token))
  }
  deleteCookie(SESSION_COOKIE, { path: '/' })
  return { ok: true }
})

export const getSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUserRow()
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
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
    const user = await getCurrentUserRow()
    if (!user) throw new Error('Você precisa entrar na sua conta primeiro.')
    if (!data.name.trim()) throw new Error('Dê um nome para o seu pet.')
    if (!data.species.trim()) throw new Error('Informe a espécie do pet.')

    const id = crypto.randomUUID()
    await db().insert(pets).values({
      id,
      ownerId: user.id,
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
    const user = await getCurrentUserRow()
    if (!user) throw new Error('Você precisa entrar na sua conta primeiro.')
    const rows = await db().select().from(pets).where(eq(pets.id, data.id))
    const pet = rows[0]
    if (!pet || pet.ownerId !== user.id) throw new Error('Pet não encontrado.')
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
    const user = await getCurrentUserRow()
    if (!user) throw new Error('Você precisa entrar na sua conta primeiro.')
    const rows = await db().select().from(pets).where(eq(pets.id, data.id))
    const pet = rows[0]
    if (!pet || pet.ownerId !== user.id) throw new Error('Pet não encontrado.')

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
  const user = await getCurrentUserRow()
  if (!user) return []
  return db().select().from(pets).where(eq(pets.ownerId, user.id))
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
    const user = await getCurrentUserRow()
    if (!user) throw new Error('Você precisa entrar na sua conta primeiro.')

    const existing = await db()
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, user.id))
    if (existing[0]) throw new Error('Você já tem um perfil de profissional.')

    const id = crypto.randomUUID()
    await db().insert(providerProfiles).values({
      id,
      userId: user.id,
      category: data.category,
      bio: data.bio?.trim() || null,
    })
    await db()
      .update(users)
      .set({ role: 'PROVIDER', avatarUrl: data.photoKey || user.avatarUrl })
      .where(eq(users.id, user.id))
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
    const user = await getCurrentUserRow()
    if (!user) throw new Error('Você precisa entrar na sua conta primeiro.')

    const rows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, user.id))
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
      await db()
        .update(users)
        .set({ avatarUrl: data.photoKey })
        .where(eq(users.id, user.id))
    }
    return { id: profile.id }
  })

// ---------------- DASHBOARD ----------------

export const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUserRow()
  if (!user) return null

  const myPets = await db().select().from(pets).where(eq(pets.ownerId, user.id))

  let providerProfile: typeof providerProfiles.$inferSelect | null = null
  let myServices: (typeof services.$inferSelect)[] = []
  if (user.role === 'PROVIDER') {
    const rows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, user.id))
    providerProfile = rows[0] ?? null
    if (providerProfile) {
      myServices = await db().select().from(services).where(eq(services.providerId, providerProfile.id))
    }
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    pets: myPets,
    providerProfile,
    services: myServices,
  }
})
