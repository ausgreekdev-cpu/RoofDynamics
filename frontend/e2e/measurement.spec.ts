import { test, expect } from '@playwright/test'

test.use({
  geolocation: { latitude: -32.05, longitude: 115.75 },
  permissions: ['geolocation'],
})

test('aerial measurement captures GPS location when permitted', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })

  await page.goto('/measurement')
  await expect(page.getByRole('heading', { name: 'Aerial Measurement' })).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: /Capture location/i }).click()
  await expect(page.getByText(/GPS -32\.05000, 115\.75000/i)).toBeVisible({ timeout: 10000 })
})

test('aerial measurement export button disabled without planes', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('you@roofing.com.au').fill('admin@perthpremier.com.au')
  await page.getByPlaceholder('••••••••').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/Executive BI Dashboard/i)).toBeVisible({ timeout: 10000 })

  await page.goto('/measurement')
  await expect(page.getByRole('button', { name: /Export to Google Earth/i })).toBeDisabled()
})
