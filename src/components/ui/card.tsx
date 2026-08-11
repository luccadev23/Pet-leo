import * as React from 'react'
import { cn } from '~/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-petlio-teal-200/50 bg-white/80 backdrop-blur-sm shadow-[0_1px_2px_rgba(13,59,74,0.06)]',
        className
      )}
      {...props}
    />
  )
}
