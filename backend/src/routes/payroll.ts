import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { calculatePayroll } from '../utils/payrollCalculator'

const router = Router()

// POST /api/payroll/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  const { crewInputs, periodStart, periodEnd } = req.body

  if (!crewInputs || !Array.isArray(crewInputs) || crewInputs.length === 0) {
    res.status(400).json({ error: 'crewInputs array is required' })
    return
  }

  try {
    const result = calculatePayroll(crewInputs)

    // Optionally save as a PayRun
    if (req.body.save === true) {
      const payRun = await prisma.payRun.create({
        data: {
          tenantId: req.body.tenantId || 'tenant-1',
          periodStart: new Date(periodStart || new Date()),
          periodEnd: new Date(periodEnd || new Date()),
          status: 'DRAFT',
          totalOTE: result.totals.totalOTE,
          totalSuper: result.totals.totalSuper,
          totalPayg: result.totals.totalPayg,
          totalMyLeave: result.totals.totalMyLeave,
          totalNetPay: result.totals.totalNetPay,
          lineCount: result.totals.lineCount,
          lines: {
            create: result.lines.map((line) => ({
              crewMemberId: line.crewMemberId,
              hoursWorked: line.hoursWorked,
              hourlyRate: line.hourlyRate,
              ote: line.ote,
              superGuarantee: line.superGuarantee,
              paygWithholding: line.paygWithholding,
              myLeaveLevy: line.myLeaveLevy,
              netPay: line.netPay,
            })),
          },
        },
        include: { lines: { include: { crewMember: true } } },
      })
      res.json({ ...result, payRunId: payRun.id })
      return
    }

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payroll calculation failed' })
  }
})

// GET /api/payroll/pay-runs
router.get('/pay-runs', async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string || 'tenant-1'
  try {
    const payRuns = await prisma.payRun.findMany({
      where: { tenantId },
      include: { lines: { include: { crewMember: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(payRuns)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch pay runs' })
  }
})

// GET /api/payroll/pay-runs/:id
router.get('/pay-runs/:id', async (req: Request, res: Response) => {
  try {
    const payRun = await prisma.payRun.findUnique({
      where: { id: req.params.id },
      include: { lines: { include: { crewMember: true } } },
    })
    if (!payRun) {
      res.status(404).json({ error: 'Pay run not found' })
      return
    }
    res.json(payRun)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch pay run' })
  }
})

// PATCH /api/payroll/pay-runs/:id
router.patch('/pay-runs/:id', async (req: Request, res: Response) => {
  try {
    const payRun = await prisma.payRun.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(payRun)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update pay run' })
  }
})

export default router
