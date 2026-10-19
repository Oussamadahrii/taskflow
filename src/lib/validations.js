import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse email invalide")),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères").max(50),
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse email invalide")),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères").max(100),
});

export const boardSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(80),
});

export const columnSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().trim().min(1, "Le titre est requis").max(50),
});

export const createCardSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().trim().min(1, "Le titre est requis").max(120),
});

export const updateCardSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().trim().min(1, "Le titre est requis").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  dueDate: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : null))
    .refine((date) => date === null || !Number.isNaN(date.getTime()), "Date invalide"),
});

export const moveCardSchema = z.object({
  cardId: z.string().min(1),
  toColumnId: z.string().min(1),
  toIndex: z.number().int().min(0),
});

// OWNER is deliberately absent: ownership is never granted through a link.
export const createInvitationSchema = z.object({
  workspaceId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"], { error: "Rôle invalide" }).default("MEMBER"),
});
