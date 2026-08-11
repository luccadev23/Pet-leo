import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { getAuth } from '~/lib/auth-server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getAuth().api.getSession({ headers: request.headers })
        if (!session) return new Response('Não autenticado.', { status: 401 })

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
        const key = `${session.user.id}/${crypto.randomUUID()}.${ext}`
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
