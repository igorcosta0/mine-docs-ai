import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
const AppHeader = () => {
  const nav = useNavigate();
  return (
    <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between py-3">
        <button onClick={() => nav("/app")} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent" />
          <span className="text-lg font-semibold">MinerDocs</span>
        </button>
        <nav className="flex items-center gap-2">
          <Link to="/app" className="text-sm">Dashboard</Link>
          <Link to="/datalake" className="text-sm">Data Lake</Link>
          <Button asChild variant="hero" size="sm">
            <Link to="/new/especificacao">Novo Documento</Link>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { signOut(); nav("/login"); }}>
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
