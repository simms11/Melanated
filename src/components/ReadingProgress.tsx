'use client'

import { useEffect, useRef } from 'react'

/**
 * A thin gold line across the top of the screen showing how far through the article the
 * reader is. Decorative (screen readers already know their position), so aria-hidden.
 * Updates once per frame at most, from a passive scroll listener.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target || !bar.current) return
    let frame = 0
    const update = () => {
      frame = 0
      const { top, height } = target.getBoundingClientRect()
      const scrollable = height - window.innerHeight
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 1
      bar.current?.style.setProperty('transform', `scaleX(${progress})`)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [targetId])

  return (
    <div
      ref={bar}
      aria-hidden="true"
      data-testid="reading-progress"
      className="bg-gold fixed inset-x-0 top-0 z-[60] h-[3px] origin-left"
      style={{ transform: 'scaleX(0)' }}
    />
  )
}
