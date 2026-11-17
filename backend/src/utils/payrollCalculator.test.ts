import { calculatePayroll, MYLEAVE_LEVY_RATE, MYLEAVE_APPRENTICE_RATE } from './payrollCalculator'

describe('payroll calculator — WA statutory rates', () => {
  const worker = {
    crewMemberId: 'c1', firstName: 'John', lastName: 'Smith',
    hourlyRate: 50, hoursWorked: 40,
  }

  it('uses 0.75% MyLeave levy for construction workers', () => {
    expect(MYLEAVE_LEVY_RATE).toBe(0.0075)
    const result = calculatePayroll([worker])
    expect(result.lines[0].myLeaveLevy).toBeCloseTo(2000 * 0.0075, 2)
    // was 2.7% (54.00) — must now be 15.00
    expect(result.lines[0].myLeaveLevy).toBe(15)
  })

  it('uses 0% MyLeave levy for apprentices', () => {
    expect(MYLEAVE_APPRENTICE_RATE).toBe(0)
    const result = calculatePayroll([{ ...worker, isApprentice: true }])
    expect(result.lines[0].myLeaveLevy).toBe(0)
  })

  it('keeps 12% super guarantee', () => {
    const result = calculatePayroll([worker])
    expect(result.lines[0].superGuarantee).toBe(240)
  })
})
