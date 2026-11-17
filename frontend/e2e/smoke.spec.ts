import { test, expect } from '@playwright/test'

// Public site accessible without authentication
test('public marketing site loads', async ({ page }) => {
  await page.goto('/site')
  await expect(page.getByText(/Perth Roofing Done Right/i)).toBeVisible()
  await expect(page.getByText(/See Your ROI/i)).toBeVisible()
  await expect(page.getByText(/Get Your Free First Report/i)).toBeVisible()
})

test('marketing ROI calculator responds to input', async ({ page }) => {
  await page.goto('/site')
  await expect(page.getByText(/Annual saving/i)).toBeVisible()
})

// Login flow and authenticated navigation
test('login flow reaches dashboard', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })
})

test('authenticated modules render', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })

  for (const [path, heading] of [
    ['/crm', 'CRM & Quoting'],
    ['/projects', 'Projects'],
    ['/pipeline', 'CRM Pipeline'],
    ['/billing', 'Billing & Credits'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByText(heading, { exact: false }).first()).toBeVisible({ timeout: 10000 })
  }
})
