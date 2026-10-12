import { z } from 'zod';
import { isValidPhone } from './phone';

// The phone number is the only account identifier.
const phone = z.string().refine(isValidPhone, 'Enter a valid phone number');

export const loginSchema = z.object({
  phone,
  password: z.string().min(6, 'At least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    phone,
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// Artisan sign-up adds a professional profile on top of the base account.
export const artisanRegisterSchema = registerSchema.and(
  z.object({
    experience: z.coerce.number().min(0, 'Enter your experience').max(60),
    bio: z.string().min(10, 'Tell customers a bit about you (min 10 chars)'),
  }),
);
export type ArtisanRegisterInput = z.infer<typeof artisanRegisterSchema>;

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
  // Optional: artisans can send a bare price + ETA quotation.
  message: z.string().optional(),
});
export type OfferInput = z.infer<typeof offerSchema>;
