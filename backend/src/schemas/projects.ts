import { z } from 'zod'

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'name is required'),
  customerName: z.string().min(1, 'customerName is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().regex(/^\d{4}$/).optional().or(z.literal('')),
  status: z.string().optional(),
  coastalZone: z.coerce.boolean().optional(),
  pitchDegrees: z.coerce.number().min(0).max(90).optional(),
  planArea: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})