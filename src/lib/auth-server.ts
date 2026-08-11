import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import * as schema from '~/db/schema'

export function getAuth() {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB as D1Database), {
      provider: 'sqlite',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'CLIENT', input: false },
        avatarUrl: { type: 'string', required: false },
        phone: { type: 'string', required: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
    },
  })
}
