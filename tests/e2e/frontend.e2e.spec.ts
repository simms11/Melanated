import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('home page renders with navigation and skip link', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Melanated/)
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached()
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('mobile navigation opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Open menu' })
    await toggle.click()
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeHidden()
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
