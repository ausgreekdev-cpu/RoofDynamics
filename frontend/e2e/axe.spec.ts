import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function login(page: any) {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })
  if (await page.getByRole('dialog').count()) {
    await page.getByRole('button', { name: 'Skip tour' }).click()
  }
}

test('dashboard has no axe violations', async ({ page }) => {
  await login(page)
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast", "region", "heading-order", "label"])
    .analyze()
  expect(results.violations).toEqual([])
})

test('settings has no axe violations', async ({ page }) => {
  await login(page)
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 })
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast", "region", "heading-order", "label"])
    .analyze()
  expect(results.violations).toEqual([])
})