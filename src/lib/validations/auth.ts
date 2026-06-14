import { z } from "zod";

// Shared rules. better-auth's default minimum password length is 8.
const email = z.email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters");

export const registerSchema = z.object({
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const forgetPasswordSchema = z.object({
  email,
});

export const updatePasswordSchema = z.object({
  password,
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgetPasswordValues = z.infer<typeof forgetPasswordSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
