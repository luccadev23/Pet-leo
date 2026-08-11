import * as React from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { cn } from '~/lib/utils'

export function ImageUploadField({
  value,
  onChange,
  className,
}: {
  value: string | null | undefined
  onChange: (key: string | null) => void
  className?: string
}) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const { key } = await res.json<{ key: string }>()
      onChange(key)
    } catch (err) {
      setError('Não foi possível enviar a imagem.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <label className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-petlio-teal-200 bg-petlio-teal-50 text-petlio-teal-600">
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : value ? (
          <img src={`/api/img/${value}`} alt="Foto" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
      <div className="text-xs text-petlio-navy/50">
        {error ? <span className="text-red-600">{error}</span> : 'JPG, PNG ou WEBP · até 5MB.'}
      </div>
    </div>
  )
}
