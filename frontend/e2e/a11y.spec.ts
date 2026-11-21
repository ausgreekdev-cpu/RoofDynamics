import { test, expect } from '@playwright/test'

test('keyboard navigation reaches sidebar links after login', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })

  // Dismiss tour
  if (await page.getByRole('dialog').count()) {
    await page.getByRole('button', { name: 'Skip tour' }).click()
  }

  // Tab until a sidebar link receives focus
  let focusedLink = ''
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    focusedLink = (await page.evaluate(() => (document.activeElement as HTMLElement)?.textContent?.trim() || '')) || focusedLink
    if (focusedLink === 'Projects' || focusedLink === 'Settings') break
  }
  expect(['Projects', 'Settings']).toContain(focusedLink)
})

test('login form is keyboard operable', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').waitFor({ timeout: 15000 })
  let found = false
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    const ph = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('placeholder') || '')
    if (ph.includes('roofing.com.au')) { found = true; break }
  }
  expect(found).toBe(true)
})
