"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations";
import { DEFAULT_COLUMNS } from "@/lib/constants";

export async function register(_prevState, formData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un compte existe déjà avec cet email." };

  // A new user gets a personal workspace and a starter board right away.
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      memberships: {
        create: {
          role: "OWNER",
          workspace: {
            create: {
              name: `Espace de ${name}`,
              boards: {
                create: {
                  title: "Mon premier tableau",
                  columns: {
                    create: DEFAULT_COLUMNS.map((title, position) => ({ title, position })),
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return login(_prevState, formData);
}

export async function login(_prevState, formData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    // signIn redirects by throwing, so only auth failures are handled here.
    if (error instanceof AuthError) return { error: "Email ou mot de passe incorrect." };
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
