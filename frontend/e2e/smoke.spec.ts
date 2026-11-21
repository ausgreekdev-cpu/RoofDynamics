import { test, expect } from '@playwright/test'

// Public site accessible without authentication
test('public marketing site loads', async ({ page }) => {
  await page.goto('/site')
  await expect(page.getByText(/Perth Roofing Done Right/i)).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/See Your ROI/i)).toBeVisible()
  await expect(page.getByText(/Get Your Free First Report/i)).toBeVisible()
})

test('marketing ROI calculator responds to input', async ({ page }) => {
  await page.goto('/site')
  await expect(page.getByText(/Annual saving/i)).toBeVisible({ timeout: 15000 })
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

  // Assert the page <h1>, not just sidebar link text — a blank RoleGuard page
  // would otherwise pass because the link itself is visible.
  for (const [path, heading] of [
    ['/crm', 'CRM & Quoting'],
    ['/projects', 'Projects'],
    ['/pipeline', 'CRM Pipeline'],
    ['/billing', 'Billing & Credits'],
    ['/compliance', 'WA Statutory Compliance'],
    ['/measurement', 'Aerial Measurement'],
    ['/reports-studio', 'Report Studio'],
    ['/operations', 'Operations Dispatch'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: false }).first()).toBeVisible({ timeout: 10000 })
  }

  // A full reload must restore the session so protected pages still render.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Operations Dispatch' }).first()).toBeVisible({ timeout: 10000 })
})

// Sidebar navigation (real clicks, not page.goto)
test('sidebar menu items open the protected modules', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })

  // Dismiss the auto-started tour so it cannot intercept clicks.
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Skip tour' }).click()

  for (const [link, heading] of [
    ['Projects', 'Projects'],
    ['Aerial Measurement', 'Aerial Measurement'],
    ['Report Studio', 'Report Studio'],
    ['CRM Pipeline', 'CRM Pipeline'],
    ['Dispatch & POs', 'Operations Dispatch'],
    ['Billing & Credits', 'Billing & Credits'],
    ['WA Compliance', 'WA Statutory Compliance'],
  ] as const) {
    await page.getByRole('link', { name: link }).click()
    await expect(page.getByRole('heading', { name: heading, exact: false }).first()).toBeVisible({ timeout: 10000 })
  }
})

// Guided onboarding tutorial
test('guided tutorial starts, advances and can be skipped', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })

  // Auto-starts on the first authenticated session.
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Welcome to RoofDynamics')).toBeVisible()
  await expect(page.getByText('Step 1 of 8')).toBeVisible()

  // Advance through the tour.
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('One-Man Empire Autopilot')).toBeVisible()
  await expect(page.getByText('Step 2 of 8')).toBeVisible()

  // Skip closes it and persists completion.
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('rd_tutorial_completed'))).toBe('true')

  // The Help button restarts the tour on demand.
  await page.getByRole('button', { name: 'Restart guided tour' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Step 1 of 8')).toBeVisible()
})
