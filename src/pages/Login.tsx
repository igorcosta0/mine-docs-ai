import { useEffect, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import { useNavigate } from "react-router-dom";
import { requireAuth } from "@/lib/auth";

const Login = () => {
  const nav = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    document.title = "Entrar — MinerDocs";
    
    const checkAuth = async () => {
      const isAuth = await requireAuth();
      if (isAuth) {
        nav("/app");
      } else {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [nav]);

  if (isChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Verificando autenticação...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="container px-4">
        <h1 className="sr-only">Login — MinerDocs</h1>
        <AuthCard onSuccess={() => nav("/app")} />
      </section>
    </main>
  );
};

export default Login;
