import { expect, test } from '@playwright/test'

import { login } from '../helpers/login'
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
})
