import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectWizard } from './ProjectWizard'

vi.mock('../../services/api', () => ({
  api: { request: vi.fn() },
}))

describe('ProjectWizard', () => {
  it('requires project and customer names before advancing', () => {
    render(<ProjectWizard onComplete={vi.fn()} />)
    const next = screen.getByRole('button', { name: 'Next' })
    expect(next).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Fremantle Re-roof' } })
    expect(next).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Customer name'), { target: { value: 'James Wilson' } })
    expect(next).not.toBeDisabled()
  })

  it('advances through the guided steps', async () => {
    render(<ProjectWizard onComplete={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText('Customer name'), { target: { value: 'Customer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByLabelText('Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Suburb'), { target: { value: 'Fremantle' } })
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Plan area (m²)')).toBeInTheDocument()
  })

  it('flags coastal suburbs automatically', () => {
    render(<ProjectWizard onComplete={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText('Customer name'), { target: { value: 'Customer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.change(screen.getByLabelText('Suburb'), { target: { value: 'Fremantle' } })
    expect(screen.getByText(/Coastal zone detected/i)).toBeInTheDocument()
  })

  it('calls onComplete with the draft on finish', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)
    render(<ProjectWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText('Customer name'), { target: { value: 'Customer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.change(screen.getByLabelText('Suburb'), { target: { value: 'Midland' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test', customerName: 'Customer', suburb: 'Midland' })
    ))
  })
})
