import { z } from 'zod'

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  email: z.string().email('invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  suburb: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

export const UpdateLeadSchema = CreateLeadSchema.partial()