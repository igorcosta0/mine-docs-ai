import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
const AppHeader = () => {
  const nav = useNavigate();
  return (
    <header className="w-full glass border-b border-border/20 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <button 
          onClick={() => nav("/app")} 
          className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
        >
          <div className="h-10 w-10 rounded-xl gradient-animate shadow-lg" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MinerDocs
          </span>
        </button>
        <nav className="flex items-center gap-4">
          <Link 
            to="/app" 
            className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-lg hover:bg-muted/50"
          >
            Dashboard
          </Link>
          <Link 
            to="/datalake" 
            className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-lg hover:bg-muted/50"
          >
            Data Lake
          </Link>
          <Button asChild variant="hero" size="sm" className="btn-glow">
            <Link to="/new/especificacao">Novo Documento</Link>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => { signOut(); nav("/login"); }}
            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
