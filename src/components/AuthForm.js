"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function AuthForm({ mode, callbackUrl }) {
  const isRegister = mode === "register";
  const [state, formAction] = useActionState(isRegister ? register : login, null);
  const switchHref = isRegister ? "/login" : "/register";

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-lg font-semibold">{isRegister ? "Créer un compte" : "Connexion"}</h1>
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

      {isRegister && (
        <label className="block text-sm font-medium">
          Nom
          <input name="name" required autoComplete="name" defaultValue={state?.values?.name} className={inputClass} />
        </label>
      )}
      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.values?.email}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className={inputClass}
        />
      </label>

      {state?.error && (
        <p role="alert" data-testid="form-error" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full">{isRegister ? "S'inscrire" : "Se connecter"}</SubmitButton>

      <p className="text-center text-sm text-slate-600">
        {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
        <Link
          href={callbackUrl ? `${switchHref}?callbackUrl=${encodeURIComponent(callbackUrl)}` : switchHref}
          className="font-medium text-indigo-600 hover:underline">
          {isRegister ? "Se connecter" : "S'inscrire"}
        </Link>
      </p>
    </form>
  );
}
