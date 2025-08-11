import { useEffect } from "react";
import AuthCard from "@/components/auth/AuthCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const nav = useNavigate();

  useEffect(() => {
    document.title = "Entrar — MinerDocs";
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/app");
    });
  }, [nav]);

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
