import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  suburb: z.string().optional(),
  postcode: z.string().regex(/^\d{4}$/).optional().or(z.literal("")),
  planArea: z.number().min(0).optional(),
  pitchDegrees: z.number().min(0).max(60).optional(),
});

export const StockItemSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Item name is required"),
  location: z.string().min(1, "Location is required"),
  quantityOnHand: z.number().min(0),
  reorderPoint: z.number().min(0),
  unitCost: z.number().min(0),
  supplier: z.string().optional(),
});

export const QuoteLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
});

export const LeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  suburb: z.string().optional(),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
export type StockItemInput = z.infer<typeof StockItemSchema>;
export type LeadInput = z.infer<typeof LeadSchema>;