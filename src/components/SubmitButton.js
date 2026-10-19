"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, pendingText = "Chargement…", className = "" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-60 ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
