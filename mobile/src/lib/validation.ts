import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(9, 'Enter a valid phone number'),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const requestSchema = z.object({
  title: z.string().min(4, 'Give your request a short title'),
  description: z.string().min(10, 'Describe the problem (min 10 chars)'),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(1),
});
export type RequestInput = z.infer<typeof requestSchema>;

export const offerSchema = z.object({
  price: z.coerce.number().min(1, 'Enter a price'),
  etaMinutes: z.coerce.number().min(1, 'Enter an ETA'),
  message: z.string().min(5, 'Add a short message'),
});
export type OfferInput = z.infer<typeof offerSchema>;
