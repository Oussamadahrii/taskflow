import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const FEATURES = [
  { title: "Tableaux Kanban", text: "Organisez vos tâches en colonnes et déplacez-les par glisser-déposer." },
  { title: "Espaces d'équipe", text: "Travaillez à plusieurs avec des rôles et des permissions." },
  { title: "Temps réel", text: "Voyez les changements de vos coéquipiers instantanément. (bientôt)" },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">TaskFlow</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        Gérez vos projets en équipe, simplement.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Des tableaux Kanban collaboratifs pour suivre vos tâches, du « à faire » au « terminé ».
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/register" className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500">
          Créer un compte
        </Link>
        <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-100">
          Se connecter
        </Link>
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{feature.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
