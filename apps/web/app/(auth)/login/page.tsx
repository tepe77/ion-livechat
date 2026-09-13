import { LoginForm } from "../../../components/auth/LoginForm";

export const metadata = {
  title: "Masuk - ION Live Chat",
  description: "Masuk ke portal ION Live Chat untuk Member, Agent, Supervisor, dan Admin.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
