import React, { useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { DocumentUploadForm } from "@/components/datalake/DocumentUploadForm";
import { DocumentsTable } from "@/components/datalake/DocumentsTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Database } from "lucide-react";

export default function DataLakeDocuments() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Data Lake - Documentos Técnicos</h1>
            <p className="text-muted-foreground">
              Gerencie especificações técnicas e documentos de engenharia
            </p>
          </div>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <DocumentsTable refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="upload">
            <DocumentUploadForm onSuccess={handleUploadSuccess} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}