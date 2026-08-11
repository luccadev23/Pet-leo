import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const timestamps = {
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}

// ================= BETTER AUTH TABLES =================
// Names/columns follow Better Auth's expected core schema (drizzle adapter).

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  // ---- app-specific additional fields ----
  role: text('role', { enum: ['CLIENT', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN'] })
    .notNull()
    .default('CLIENT'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

// ================= APP TABLES =================

// ---- Pets ----
export const pets = sqliteTable('pets', {
  id: id(),
  ownerId: text('owner_id').notNull().references(() => user.id),
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
  userId: text('user_id').notNull().references(() => user.id).unique(),
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
  clientId: text('client_id').notNull().references(() => user.id),
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
  senderId: text('sender_id').notNull().references(() => user.id),
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
  userId: text('user_id').notNull().references(() => user.id).unique(),
  balanceCents: integer('balance_cents').notNull().default(0),
  cashbackCents: integer('cashback_cents').notNull().default(0),
  ...timestamps,
})

// ---- Reviews ----
export const reviews = sqliteTable('reviews', {
  id: id(),
  bookingId: text('booking_id').notNull().references(() => bookings.id).unique(),
  authorId: text('author_id').notNull().references(() => user.id),
  providerId: text('provider_id').notNull().references(() => providerProfiles.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
