import * as React from 'react'
import { cn } from '~/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-petlio-teal-200 bg-white px-4 text-sm text-petlio-ink placeholder:text-petlio-navy/40 outline-none transition-colors focus:border-petlio-teal-600 focus:ring-2 focus:ring-petlio-teal-600/20',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('mb-1.5 block text-sm font-medium text-petlio-navy', className)} {...props} />
)

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-petlio-teal-200 bg-white px-4 text-sm text-petlio-ink outline-none transition-colors focus:border-petlio-teal-600 focus:ring-2 focus:ring-petlio-teal-600/20',
        className
      )}
      {...props}
    />
  )
)
Select.displayName = 'Select'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-petlio-teal-200 bg-white px-4 py-3 text-sm text-petlio-ink placeholder:text-petlio-navy/40 outline-none transition-colors focus:border-petlio-teal-600 focus:ring-2 focus:ring-petlio-teal-600/20',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
