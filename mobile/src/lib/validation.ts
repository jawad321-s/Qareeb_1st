import { z } from 'zod';
import { isValidPhone } from './phone';

// The phone number is the only account identifier. The message is a
// translation key; screens pass it through t().
const phone = z.string().trim().refine(isValidPhone, 'auth.errPhoneFormat');

export const loginSchema = z.object({
  phone,
  password: z.string().min(6, 'reset.err.short'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'auth.errName'),
    phone,
    password: z.string().min(6, 'reset.err.short'),
    confirmPassword: z.string().min(1, 'auth.errConfirm'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'reset.err.match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// Artisan sign-up adds a professional profile on top of the base account.
export const artisanRegisterSchema = registerSchema.and(
  z.object({
    experience: z.coerce.number({ invalid_type_error: 'auth.errExperience' }).min(0, 'auth.errExperience').max(60, 'auth.errExperience'),
    bio: z.string().trim().min(10, 'auth.errBio'),
  }),
);
export type ArtisanRegisterInput = z.infer<typeof artisanRegisterSchema>;

export const requestSchema = z.object({
  title: z.string().min(4, 'Give your request a short title'),
  description: z.string().min(10, 'Describe the problem (min 10 chars)'),
});
export type RequestInput = z.infer<typeof requestSchema>;

export const offerSchema = z.object({
  price: z.coerce.number().min(1, 'Enter a price'),
  etaMinutes: z.coerce.number().min(1, 'Enter an ETA'),
  // Optional: artisans can send a bare price + ETA quotation.
  message: z.string().optional(),
});
export type OfferInput = z.infer<typeof offerSchema>;
