import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, desc } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { user, pets, providerProfiles, services, bookings } from '~/db/schema'
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
      category: 'VETERINARIO' | 'PASSEADOR' | 'PET_SITTER' | 'TRANSPORTE' | 'PET_SHOP' | 'BANHO_TOSA'
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
      category: 'VETERINARIO' | 'PASSEADOR' | 'PET_SITTER' | 'TRANSPORTE' | 'PET_SHOP' | 'BANHO_TOSA'
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

export const getProvidersByCategory = createServerFn({ method: 'GET' })
  .validator(
    (d: {
      category: 'VETERINARIO' | 'PASSEADOR' | 'PET_SITTER' | 'TRANSPORTE' | 'PET_SHOP' | 'BANHO_TOSA'
    }) => d
  )
  .handler(async ({ data }) => {
    const rows = await db()
      .select({
        id: providerProfiles.id,
        bio: providerProfiles.bio,
        ratingAvg: providerProfiles.ratingAvg,
        ratingCount: providerProfiles.ratingCount,
        verified: providerProfiles.verified,
        name: user.name,
        avatarUrl: user.avatarUrl,
      })
      .from(providerProfiles)
      .innerJoin(user, eq(providerProfiles.userId, user.id))
      .where(eq(providerProfiles.category, data.category))

    const providers = await Promise.all(
      rows.map(async (p) => ({
        ...p,
        services: await db()
          .select()
          .from(services)
          .where(and(eq(services.providerId, p.id), eq(services.active, true))),
      }))
    )
    return providers
  })

// ---------------- SERVICES ----------------

export const createService = createServerFn({ method: 'POST' })
  .validator(
    (d: { name: string; description?: string; durationMinutes: number; priceCents: number }) => d
  )
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')
    if (!data.name.trim()) throw new Error('Dê um nome para o serviço.')
    if (data.priceCents <= 0) throw new Error('Informe um preço válido.')

    const rows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
    const profile = rows[0]
    if (!profile) throw new Error('Você precisa ter um perfil profissional primeiro.')

    const id = crypto.randomUUID()
    await db().insert(services).values({
      id,
      providerId: profile.id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      durationMinutes: data.durationMinutes,
      priceCents: data.priceCents,
    })
    return { id }
  })

export const updateService = createServerFn({ method: 'POST' })
  .validator(
    (d: {
      id: string
      name: string
      description?: string
      durationMinutes: number
      priceCents: number
      active: boolean
    }) => d
  )
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')

    const profileRows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
    const profile = profileRows[0]
    if (!profile) throw new Error('Perfil profissional não encontrado.')

    const serviceRows = await db().select().from(services).where(eq(services.id, data.id))
    const service = serviceRows[0]
    if (!service || service.providerId !== profile.id) throw new Error('Serviço não encontrado.')

    await db()
      .update(services)
      .set({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        durationMinutes: data.durationMinutes,
        priceCents: data.priceCents,
        active: data.active,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(services.id, data.id))
    return { id: data.id }
  })

export const deleteService = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')

    const profileRows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
    const profile = profileRows[0]
    if (!profile) throw new Error('Perfil profissional não encontrado.')

    const serviceRows = await db().select().from(services).where(eq(services.id, data.id))
    const service = serviceRows[0]
    if (!service || service.providerId !== profile.id) throw new Error('Serviço não encontrado.')

    await db().delete(services).where(eq(services.id, data.id))
    return { id: data.id }
  })

// ---------------- BOOKINGS ----------------

export const getProviderDetail = createServerFn({ method: 'GET' })
  .validator((d: { providerId: string }) => d)
  .handler(async ({ data }) => {
    const rows = await db()
      .select({
        id: providerProfiles.id,
        category: providerProfiles.category,
        bio: providerProfiles.bio,
        ratingAvg: providerProfiles.ratingAvg,
        ratingCount: providerProfiles.ratingCount,
        verified: providerProfiles.verified,
        name: user.name,
        avatarUrl: user.avatarUrl,
      })
      .from(providerProfiles)
      .innerJoin(user, eq(providerProfiles.userId, user.id))
      .where(eq(providerProfiles.id, data.providerId))
    const provider = rows[0]
    if (!provider) throw new Error('Profissional não encontrado.')

    const providerServices = await db()
      .select()
      .from(services)
      .where(and(eq(services.providerId, provider.id), eq(services.active, true)))

    return { ...provider, services: providerServices }
  })

export const createBooking = createServerFn({ method: 'POST' })
  .validator(
    (d: { providerId: string; serviceId: string; petId: string; scheduledAt: string; notes?: string }) => d
  )
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')

    const petRows = await db().select().from(pets).where(eq(pets.id, data.petId))
    const pet = petRows[0]
    if (!pet || pet.ownerId !== u.id) throw new Error('Pet não encontrado.')

    const serviceRows = await db().select().from(services).where(eq(services.id, data.serviceId))
    const service = serviceRows[0]
    if (!service || service.providerId !== data.providerId || !service.active) {
      throw new Error('Serviço não encontrado.')
    }

    if (!data.scheduledAt) throw new Error('Escolha uma data e horário.')
    if (new Date(data.scheduledAt).getTime() < Date.now()) {
      throw new Error('Escolha uma data e horário futuros.')
    }

    const id = crypto.randomUUID()
    await db().insert(bookings).values({
      id,
      clientId: u.id,
      petId: data.petId,
      providerId: data.providerId,
      serviceId: data.serviceId,
      scheduledAt: data.scheduledAt,
      priceCents: service.priceCents,
      notes: data.notes?.trim() || null,
    })
    return { id }
  })

export const getMyBookings = createServerFn({ method: 'GET' }).handler(async () => {
  const u = await getCurrentUserRow()
  if (!u) return []

  const rows = await db()
    .select({
      id: bookings.id,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      priceCents: bookings.priceCents,
      createdAt: bookings.createdAt,
      petName: pets.name,
      serviceName: services.name,
      providerId: providerProfiles.id,
      providerName: user.name,
    })
    .from(bookings)
    .innerJoin(pets, eq(bookings.petId, pets.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(providerProfiles, eq(bookings.providerId, providerProfiles.id))
    .innerJoin(user, eq(providerProfiles.userId, user.id))
    .where(eq(bookings.clientId, u.id))
    .orderBy(desc(bookings.scheduledAt))

  return rows
})

export const getReceivedBookings = createServerFn({ method: 'GET' }).handler(async () => {
  const u = await getCurrentUserRow()
  if (!u) return []

  const profileRows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
  const profile = profileRows[0]
  if (!profile) return []

  const rows = await db()
    .select({
      id: bookings.id,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      priceCents: bookings.priceCents,
      createdAt: bookings.createdAt,
      petName: pets.name,
      serviceName: services.name,
      clientName: user.name,
    })
    .from(bookings)
    .innerJoin(pets, eq(bookings.petId, pets.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(user, eq(bookings.clientId, user.id))
    .where(eq(bookings.providerId, profile.id))
    .orderBy(desc(bookings.scheduledAt))

  return rows
})

export const updateBookingStatus = createServerFn({ method: 'POST' })
  .validator((d: { id: string; status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' }) => d)
  .handler(async ({ data }) => {
    const u = await getCurrentUserRow()
    if (!u) throw new Error('Você precisa entrar na sua conta primeiro.')

    const rows = await db().select().from(bookings).where(eq(bookings.id, data.id))
    const booking = rows[0]
    if (!booking) throw new Error('Agendamento não encontrado.')

    const profileRows = await db().select().from(providerProfiles).where(eq(providerProfiles.userId, u.id))
    const profile = profileRows[0]
    const isProvider = profile && booking.providerId === profile.id
    const isClient = booking.clientId === u.id
    if (!isProvider && !isClient) throw new Error('Você não tem acesso a este agendamento.')
    if (data.status !== 'CANCELLED' && !isProvider) throw new Error('Somente o profissional pode confirmar ou concluir.')

    await db()
      .update(bookings)
      .set({ status: data.status, updatedAt: new Date().toISOString() })
      .where(eq(bookings.id, data.id))
    return { id: data.id }
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
