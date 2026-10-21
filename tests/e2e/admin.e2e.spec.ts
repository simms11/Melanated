import { expect, test } from '@playwright/test'

import { login } from '../helpers/login'
import { cleanupAuthorDraft, seedAuthorDraft, testAuthor } from '../helpers/seedAuthorPost'
import { seedTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin', () => {
  test.beforeAll(async () => {
    await seedTestUser()
  })

  test('admin can sign in and see content collections', async ({ page }) => {
    await login({ page, user: testUser })
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByRole('link', { name: 'Posts', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Categories', exact: true })).toBeVisible()
  })

  // ADR 0003: with "Authors can publish without review" off, a writer can save drafts but
  // must not be offered Publish or Schedule (a schedule would silently fail at 6am).
  test.describe('what a writer sees on their draft', () => {
    let postId: number
    test.beforeAll(async () => {
      postId = await seedAuthorDraft()
    })
    test.afterAll(async () => {
      await cleanupAuthorDraft()
    })

    test('a writer can edit but is not offered Publish or Schedule', async ({ page }) => {
      await login({ page, user: testAuthor })
      await page.goto(`/admin/collections/posts/${postId}`)
      // Posts autosave drafts, so the writer's edit form has no save button to look for.
      await expect(page.locator('#field-title')).toBeVisible()
      await expect(page.getByRole('button', { name: /^publish/i })).toHaveCount(0)
      await expect(page.getByText(/schedule publish/i)).toHaveCount(0)
    })

    // Uses the seeded draft: opening "Create new" autosaves an empty draft every time.
    test('the post editor offers a Gallery block', async ({ page }) => {
      await login({ page, user: testUser })
      await page.goto(`/admin/collections/posts/${postId}`)
      await page.getByRole('button', { name: 'blocks dropdown' }).click()
      await expect(
        page
          .getByRole('button', { name: 'Gallery' })
          .or(page.getByText('Gallery', { exact: true }))
          .first(),
      ).toBeVisible()
    })

    test('an admin is offered Publish on the same draft', async ({ page }) => {
      await login({ page, user: testUser })
      await page.goto(`/admin/collections/posts/${postId}`)
      await expect(page.getByRole('button', { name: /^publish/i }).first()).toBeVisible()
    })
  })
})
