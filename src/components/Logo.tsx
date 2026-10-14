import { cn } from '@/lib/utils'

/**
 * Text wordmark in the brand's gold gradient. Swap for an SVG of the final
 * logo once the client confirms "Melanated Online" vs "Melanated Magazine".
 */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex flex-col leading-none', className)}>
      <span
        className="font-sans text-[1.35rem] font-semibold tracking-[0.08em] uppercase lg:text-[1.6rem]"
        style={{
          backgroundImage: 'linear-gradient(90deg, #b98a1e 0%, #e9c45a 45%, #c99a2b 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Melanated
      </span>
      <span
        className={cn(
          'self-end font-sans text-[0.5rem] tracking-[0.42em] uppercase lg:text-[0.55rem]',
          light ? 'text-nude' : 'text-caramel-600',
        )}
      >
        Online
      </span>
    </span>
  )
}
