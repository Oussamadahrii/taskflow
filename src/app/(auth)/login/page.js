import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Connexion · TaskFlow" };

export default async function LoginPage({ searchParams }) {
  const { callbackUrl } = await searchParams;
  return <AuthForm mode="login" callbackUrl={callbackUrl} />;
}
