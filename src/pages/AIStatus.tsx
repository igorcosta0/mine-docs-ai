import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { AIProviderStatus } from '@/components/ai/AIProviderStatus';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AIStatus = () => {
  React.useEffect(() => {
    document.title = "MinerDocs — Status dos Provedores de IA";
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Status dos Provedores de IA</h1>
          <p className="text-muted-foreground">
            Monitore o status e disponibilidade dos provedores de inteligência artificial do sistema.
          </p>
        </div>

        <AIProviderStatus />
      </div>
    </AppLayout>
  );
};

export default AIStatus;