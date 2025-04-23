
import { AuthProvider } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

const LoginPage = () => {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
};

export default LoginPage;
