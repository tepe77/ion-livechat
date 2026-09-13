import { RegisterForm } from "../../../components/auth/RegisterForm";

export const metadata = {
  title: "Daftar Akun Member - ION Live Chat",
  description: "Daftar akun member baru ION Live Chat untuk mendapatkan dukungan teknis.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
