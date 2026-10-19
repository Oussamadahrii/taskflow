"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations";
import { DEFAULT_COLUMNS } from "@/lib/constants";

// React resets the form after an action: returning the typed values lets the
// form show them again next to the error message (never the password).
function failure(error, formData) {
  return { error, values: { name: formData.get("name") ?? "", email: formData.get("email") ?? "" } };
}

export async function register(_prevState, formData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return failure(parsed.error.issues[0].message, formData);
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return failure("Un compte existe déjà avec cet email.", formData);

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
    return failure(parsed.error.issues[0].message, formData);
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    // signIn redirects by throwing, so only auth failures are handled here.
    if (error instanceof AuthError) return failure("Email ou mot de passe incorrect.", formData);
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
