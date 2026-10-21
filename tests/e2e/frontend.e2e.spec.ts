import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('home page renders with navigation and skip link', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Melanated/)
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached()
    await expect(page.locator('h1').first()).toBeVisible()
  })

  // Navigation is never hidden behind a menu: on a phone every section is one tap away.
  // (The old ☰ panel was clipped to the header by backdrop-blur and showed one link.)
  test('section navigation is visible and tappable on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/beauty')
    const nav = page.getByRole('navigation', { name: 'Sections', exact: true })
    await expect(nav).toBeVisible()
    for (const name of ['Fashion', 'Beauty', 'Wellness', 'Business', 'Community']) {
      const link = nav.getByRole('link', { name, exact: true })
      await link.scrollIntoViewIfNeeded()
      await expect(link).toBeInViewport()
      const box = await link.boundingBox()
      expect(box?.height, `${name} tap target`).toBeGreaterThanOrEqual(44)
    }
    await expect(nav.getByRole('link', { name: 'Beauty', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.getByRole('button', { name: /menu/i })).toHaveCount(0)
  })

  test('tablets get the full navigation', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Sections', exact: true })
    for (const name of ['Fashion', 'Beauty', 'Wellness', 'Business', 'Community']) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeInViewport()
    }
  })

  // WCAG 2.4.4 / 4.1.2: a link a keyboard or screen-reader user can reach must say where it
  // goes. Image-only links with alt="" were announced as just "link".
  test('every focusable link on the home page has an accessible name', async ({ page }) => {
    await page.goto('/')
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .filter((a) => a.getAttribute('tabindex') !== '-1' && !a.closest('[aria-hidden="true"]'))
        .filter((a) => {
          const alts = [...a.querySelectorAll('img')].map((i) => i.getAttribute('alt') ?? '')
          const name = [a.getAttribute('aria-label'), a.textContent, ...alts].join('').trim()
          return name === ''
        })
        .map((a) => a.getAttribute('href')),
    )
    expect(unnamed).toEqual([])
  })

  test('community page and 404 are on-brand', async ({ page }) => {
    await page.goto('/community')
    await expect(page.locator('h1')).toContainText(/connect/i)
    const res = await page.goto('/this-does-not-exist')
    expect(res?.status()).toBe(404)
    await expect(page.locator('h1')).toContainText(/find that page/i)
  })

  test('sitemap, robots and feed respond', async ({ request }) => {
    for (const path of ['/sitemap.xml', '/robots.txt', '/feed.xml']) {
      const res = await request.get(path)
      expect(res.ok(), path).toBeTruthy()
    }
  })
})
