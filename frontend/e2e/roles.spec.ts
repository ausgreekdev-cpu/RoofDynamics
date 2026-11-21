import { test, expect } from '@playwright/test'

function loginAs(page: any, email: string) {
  return (async () => {
    await page.goto('/')
    await page.getByPlaceholder('you@roofing.com.au').fill(email)
    await page.getByPlaceholder('••••••••').fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).click()
  })()
}

test('developer lands on platform portal and sees Platform link', async ({ page }) => {
  await loginAs(page, 'dev@ausgreekdev.com')
  await expect(page.getByRole('heading', { name: /Developer Platform/i })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('link', { name: 'Platform' })).toBeVisible()
})

test('developer can still open tenant modules', async ({ page }) => {
  await loginAs(page, 'dev@ausgreekdev.com')
  await expect(page.getByRole('heading', { name: /Developer Platform/i })).toBeVisible({ timeout: 10000 })
  await page.goto('/dashboard')
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 })
})

test('admin does not see Platform link', async ({ page }) => {
  await loginAs(page, 'admin@perthpremier.com.au')
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('link', { name: 'Platform' })).toHaveCount(0)
})

test('manager role has no Platform link and reaches dashboard', async ({ page }) => {
  await loginAs(page, 'manager@perthpremier.com.au')
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('link', { name: 'Platform' })).toHaveCount(0)
})

test('crew role reaches dashboard without Platform link', async ({ page }) => {
  await loginAs(page, 'crew@perthpremier.com.au')
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('link', { name: 'Platform' })).toHaveCount(0)
})

test('viewer role reaches dashboard without Platform link', async ({ page }) => {
  await loginAs(page, 'viewer@perthpremier.com.au')
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('link', { name: 'Platform' })).toHaveCount(0)
})

test('developer can impersonate a tenant and exit', async ({ page }) => {
  await loginAs(page, 'dev@ausgreekdev.com')
  await expect(page.getByRole('heading', { name: /Developer Platform/i })).toBeVisible({ timeout: 10000 })
  // Enter impersonation via the first "View as tenant" button if present
  const viewBtn = page.getByRole('button', { name: /View as tenant/i }).first()
  if (await viewBtn.count()) {
    await viewBtn.click()
    // confirm dialog
    await page.getByRole('button', { name: 'Switch' }).click()
    await expect(page.getByText(/Viewing as tenant/i)).toBeVisible({ timeout: 10000 })
    // exit
    await page.getByRole('button', { name: /Exit impersonation/i }).click()
    await expect(page.getByText(/Viewing as tenant/i)).toHaveCount(0)
  }
})
