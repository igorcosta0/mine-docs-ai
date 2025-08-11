import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const AuthCard = ({ onSuccess }: { onSuccess: () => void }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Fallback de autenticação local (substituir por Supabase quando conectado)
      if (!email || !password) throw new Error("Informe e-mail e senha");
      localStorage.setItem("auth_user", email);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Autenticação falhou", description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Entrar" : "Criar conta"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading} variant="hero" className="w-full">
              {loading ? "Processando..." : mode === "login" ? "Entrar" : "Cadastrar"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Criar conta" : "Já tenho conta"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthCard;
