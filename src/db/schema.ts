import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const timestamps = {
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}

// ---- Users (clients & providers share the account table, role decides the shape) ----
export const users = sqliteTable('users', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['CLIENT', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN'] })
    .notNull()
    .default('CLIENT'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  ...timestamps,
})

// ---- Pets ----
export const pets = sqliteTable('pets', {
  id: id(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  species: text('species').notNull(),
  breed: text('breed'),
  sex: text('sex', { enum: ['MALE', 'FEMALE', 'UNKNOWN'] }).default('UNKNOWN'),
  birthDate: text('birth_date'),
  weightKg: real('weight_kg'),
  photoUrl: text('photo_url'),
  allergies: text('allergies'),
  medications: text('medications'),
  vaccinations: text('vaccinations'),
  notes: text('notes'),
  ...timestamps,
})

// ---- Provider profile (extends a user with role PROVIDER) ----
export const providerProfiles = sqliteTable('provider_profiles', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id).unique(),
  category: text('category', {
    enum: ['VETERINARIO', 'PASSEADOR', 'PET_SITTER', 'TRANSPORTE', 'PET_SHOP', 'CLINICA'],
  }).notNull(),
  bio: text('bio'),
  ratingAvg: real('rating_avg').default(0),
  ratingCount: integer('rating_count').default(0),
  verified: integer('verified', { mode: 'boolean' }).default(false),
  ...timestamps,
})

// ---- Services offered by a provider ----
export const services = sqliteTable('services', {
  id: id(),
  providerId: text('provider_id').notNull().references(() => providerProfiles.id),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  priceCents: integer('price_cents').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  ...timestamps,
})

// ---- Bookings / agendamentos ----
export const bookings = sqliteTable('bookings', {
  id: id(),
  clientId: text('client_id').notNull().references(() => users.id),
  petId: text('pet_id').notNull().references(() => pets.id),
  providerId: text('provider_id').notNull().references(() => providerProfiles.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  scheduledAt: text('scheduled_at').notNull(),
  status: text('status', {
    enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  })
    .notNull()
    .default('PENDING'),
  priceCents: integer('price_cents').notNull(),
  ...timestamps,
})

// ---- Chat ----
export const chatMessages = sqliteTable('chat_messages', {
  id: id(),
  bookingId: text('booking_id').notNull().references(() => bookings.id),
  senderId: text('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// ---- Payments ----
export const payments = sqliteTable('payments', {
  id: id(),
  bookingId: text('booking_id').notNull().references(() => bookings.id).unique(),
  amountCents: integer('amount_cents').notNull(),
  platformFeeCents: integer('platform_fee_cents').notNull().default(0),
  providerFeeCents: integer('provider_fee_cents').notNull().default(0),
  status: text('status', {
    enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'],
  })
    .notNull()
    .default('PENDING'),
  ...timestamps,
})

// ---- Wallet ----
export const wallets = sqliteTable('wallets', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id).unique(),
  balanceCents: integer('balance_cents').notNull().default(0),
  cashbackCents: integer('cashback_cents').notNull().default(0),
  ...timestamps,
})

// ---- Sessions ----
export const sessions = sqliteTable('sessions', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// ---- Reviews ----
export const reviews = sqliteTable('reviews', {
  id: id(),
  bookingId: text('booking_id').notNull().references(() => bookings.id).unique(),
  authorId: text('author_id').notNull().references(() => users.id),
  providerId: text('provider_id').notNull().references(() => providerProfiles.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
