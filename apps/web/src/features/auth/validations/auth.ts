import { z } from "zod";

const email = z.email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters");
const name = z.string().trim().min(1, "Name is required").max(100);

export const registerSchema = z.object({
  name,
  email,
  password,
});

export const profileNameSchema = z.object({ name });

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
export type ProfileNameValues = z.infer<typeof profileNameSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgetPasswordValues = z.infer<typeof forgetPasswordSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
