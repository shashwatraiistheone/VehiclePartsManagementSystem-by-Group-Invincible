import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'

type Props = {
  value: number
  onChange: (rating: number) => void
  size?: 'md' | 'lg'
  centered?: boolean
}

export function StarRatingInput({ value, onChange, size = 'lg', centered = false }: Props) {
  const [hover, setHover] = useState(0)
  const iconClass = size === 'lg' ? 'h-10 w-10 sm:h-11 sm:w-11' : 'h-8 w-8'
  const active = hover || value

  return (
    <div
      className={['flex gap-1.5 sm:gap-2', centered ? 'justify-center' : ''].join(' ')}
      role="group"
      aria-label="Star rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <StarIcon
            className={[
              iconClass,
              n <= active ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300',
            ].join(' ')}
          />
        </button>
      ))}
    </div>
  )
}
