import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewDocument from "./pages/NewDocument";
import DocumentViewer from "./pages/DocumentViewer";
import DataLake from "./pages/DataLake";
import DataLakeDocuments from "./pages/DataLakeDocuments";
import EngineeringDashboard from "./pages/EngineeringDashboard";
import DocumentsByType from "./pages/DocumentsByType";
import { requireAuth } from "@/lib/auth";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  
  useEffect(() => {
    requireAuth().then(setIsAuth);
  }, []);
  
  if (isAuth === null) return <div>Carregando...</div>;
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/engenharia" element={<ProtectedRoute><EngineeringDashboard /></ProtectedRoute>} />
          <Route path="/documentos/:tipo" element={<ProtectedRoute><DocumentsByType /></ProtectedRoute>} />
          <Route path="/novo-documento" element={<ProtectedRoute><NewDocument /></ProtectedRoute>} />
          <Route path="/documento/:id" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
          <Route path="/new/:type" element={<ProtectedRoute><NewDocument /></ProtectedRoute>} />
          <Route path="/doc/:id" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
          <Route path="/datalake" element={<ProtectedRoute><DataLake /></ProtectedRoute>} />
          <Route path="/datalake-docs" element={<ProtectedRoute><DataLakeDocuments /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
