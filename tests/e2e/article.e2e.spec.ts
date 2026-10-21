import { expect, test } from '@playwright/test'

import { cleanupGalleryPost, seedGalleryPost } from '../helpers/seedGalleryPost'

let path: string

test.beforeAll(async () => {
  path = await seedGalleryPost()
})
test.afterAll(async () => {
  await cleanupGalleryPost()
})

test.describe('Article reading features', () => {
  test('gallery photos open full screen, move with the keyboard, and close back to the photo', async ({
    page,
  }) => {
    await page.goto(path)
    const thumbs = page.getByRole('link', { name: /View photo \d of 3 full screen/ })
    await expect(thumbs).toHaveCount(3)
    // Without JavaScript each thumbnail is a plain link to the full image.
    await expect(thumbs.first()).toHaveAttribute('href', /\/api\/media\/file\//)

    await thumbs.first().click()
    const viewer = page.getByRole('dialog', { name: 'Photo viewer' })
    await expect(viewer).toBeVisible()
    await expect(viewer.getByText('1 of 3')).toBeVisible()
    await expect(viewer.getByRole('img', { name: 'Gallery look 1' })).toBeVisible()

    await page.keyboard.press('ArrowRight')
    await expect(viewer.getByText('2 of 3')).toBeVisible()
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(viewer.getByText('3 of 3')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
    await expect(thumbs.first()).toBeFocused()
  })

  test('share copies the link where there is no share sheet', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    // Desktop Chromium may or may not have navigator.share; force the fallback path.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    })
    await page.goto(path)
    await page.getByRole('button', { name: 'Share' }).first().click()
    await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeVisible()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toMatch(new RegExp(`${path}$`))
  })

  test('the reading-progress bar follows the scroll through the article', async ({ page }) => {
    await page.goto(path)
    const bar = page.getByTestId('reading-progress')
    const scale = () => bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
    expect(await scale()).toBeLessThan(0.05)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect.poll(scale).toBeGreaterThan(0.95)
  })
})
