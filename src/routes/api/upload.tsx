import { createFileRoute } from '@tanstack/react-router'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { sessions } from '~/db/schema'

function getCookieValue(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = getCookieValue(request, 'petlio_session')
        if (!token) return new Response('Não autenticado.', { status: 401 })

        const db = drizzle(env.DB as D1Database)
        const rows = await db.select().from(sessions).where(eq(sessions.id, token))
        const session = rows[0]
        if (!session || new Date(session.expiresAt) < new Date()) {
          return new Response('Sessão expirada.', { status: 401 })
        }

        const form = await request.formData()
        const file = form.get('file')
        if (!(file instanceof File)) {
          return new Response('Arquivo ausente.', { status: 400 })
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          return new Response('Formato de imagem não suportado.', { status: 400 })
        }
        if (file.size > MAX_BYTES) {
          return new Response('Imagem muito grande (máx. 5MB).', { status: 400 })
        }

        const ext = file.type.split('/')[1]
        const key = `${session.userId}/${crypto.randomUUID()}.${ext}`
        await (env.IMAGES as R2Bucket).put(key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type },
        })

        return new Response(JSON.stringify({ key }), {
          headers: { 'content-type': 'application/json' },
        })
      },
    },
  },
})
