import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Introduce un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Introduce un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Only allow safe internal redirects from `?next=` (blocks `//evil`, `http…`). */
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/cuenta";
  return raw;
}
