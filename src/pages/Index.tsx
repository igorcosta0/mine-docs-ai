import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requireAuth } from "@/lib/auth";

const Index = () => {
  const nav = useNavigate();
  useEffect(() => {
    document.title = "MinerDocs — Início";
    if (requireAuth()) nav("/app"); else nav("/login");
  }, [nav]);
  return <div className="p-6 text-muted-foreground">Redirecionando...</div>;
};

export default Index;
