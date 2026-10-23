import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Inscription · TaskFlow" };

export default async function RegisterPage({ searchParams }) {
  const { callbackUrl } = await searchParams;
  return <AuthForm mode="register" callbackUrl={callbackUrl} />;
}
