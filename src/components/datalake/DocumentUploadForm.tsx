import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload } from "lucide-react";
import { ingestDocument, type IngestDocumentParams } from "@/lib/datalakeDocuments";
import { toast } from "sonner";

interface DocumentUploadFormProps {
  onSuccess?: () => void;
}

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    doc_number: '',
    rev: '',
    title: '',
    customer: '',
    project: '',
    contractor: '',
    issue_date: '',
    classification: '',
    location: '',
  });
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [norms, setNorms] = useState<string[]>([]);
  const [figuresTables, setFiguresTables] = useState<string[]>([]);
  const [newDiscipline, setNewDiscipline] = useState('');
  const [newNorm, setNewNorm] = useState('');
  const [newFigureTable, setNewFigureTable] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (array: string[], value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value.trim() && !array.includes(value.trim())) {
      setter([...array, value.trim()]);
    }
  };

  const removeFromArray = (array: string[], index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(array.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Selecione um arquivo PDF');
      return;
    }

    if (!formData.doc_number || !formData.rev || !formData.title) {
      toast.error('Preencha os campos obrigatórios: Número do Documento, Revisão e Título');
      return;
    }

    setIsLoading(true);

    try {
      const params: IngestDocumentParams = {
        file,
        doc_type: 'especificacao_tecnica',
        doc_number: formData.doc_number,
        rev: formData.rev,
        title: formData.title,
        customer: formData.customer || undefined,
        project: formData.project || undefined,
        contractor: formData.contractor || undefined,
        issue_date: formData.issue_date || undefined,
        classification: formData.classification || undefined,
        location: formData.location || undefined,
        disciplines: disciplines.length > 0 ? disciplines : undefined,
        norms: norms.length > 0 ? norms : undefined,
        figures_tables: figuresTables.length > 0 ? figuresTables : undefined,
        overwrite,
      };

      const result = await ingestDocument(params);

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Documento enviado com sucesso!');
        // Reset form
        setFile(null);
        setFormData({
          doc_number: '',
          rev: '',
          title: '',
          customer: '',
          project: '',
          contractor: '',
          issue_date: '',
          classification: '',
          location: '',
        });
        setDisciplines([]);
        setNorms([]);
        setFiguresTables([]);
        setOverwrite(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Erro interno do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Especificação Técnica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo PDF *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doc_number">Número do Documento *</Label>
              <Input
                id="doc_number"
                value={formData.doc_number}
                onChange={(e) => handleInputChange('doc_number', e.target.value)}
                placeholder="ET-1001MSC-X-00004"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev">Revisão *</Label>
              <Input
                id="rev"
                value={formData.rev}
                onChange={(e) => handleInputChange('rev', e.target.value)}
                placeholder="A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_date">Data de Emissão</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleInputChange('issue_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Especificação Técnica de Investigações..."
              required
            />
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => handleInputChange('customer', e.target.value)}
                placeholder="LHG Mining"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractor">Contratada</Label>
              <Input
                id="contractor"
                value={formData.contractor}
                onChange={(e) => handleInputChange('contractor', e.target.value)}
                placeholder="BVP Geotecnia e Hidrotecnia"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Projeto</Label>
            <Input
              id="project"
              value={formData.project}
              onChange={(e) => handleInputChange('project', e.target.value)}
              placeholder="Mina Santa Cruz – PDR filtrado – Pilhas 3 e 4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classification">Classificação</Label>
              <Input
                id="classification"
                value={formData.classification}
                onChange={(e) => handleInputChange('classification', e.target.value)}
                placeholder="Interno"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Mina Santa Cruz, Corumbá–MS"
              />
            </div>
          </div>

          {/* Arrays */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Disciplinas</Label>
              <div className="flex gap-2">
                <Input
                  value={newDiscipline}
                  onChange={(e) => setNewDiscipline(e.target.value)}
                  placeholder="Ex: Geotecnia"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray(disciplines, newDiscipline, setDisciplines);
                      setNewDiscipline('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    addToArray(disciplines, newDiscipline, setDisciplines);
                    setNewDiscipline('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {disciplines.map((discipline, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {discipline}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(disciplines, index, setDisciplines)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Normas</Label>
              <div className="flex gap-2">
                <Input
                  value={newNorm}
                  onChange={(e) => setNewNorm(e.target.value)}
                  placeholder="Ex: NBR 6484:2020"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray(norms, newNorm, setNorms);
                      setNewNorm('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    addToArray(norms, newNorm, setNorms);
                    setNewNorm('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {norms.map((norm, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {norm}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(norms, index, setNorms)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Figuras e Tabelas</Label>
              <div className="flex gap-2">
                <Input
                  value={newFigureTable}
                  onChange={(e) => setNewFigureTable(e.target.value)}
                  placeholder="Ex: Figura 3-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray(figuresTables, newFigureTable, setFiguresTables);
                      setNewFigureTable('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    addToArray(figuresTables, newFigureTable, setFiguresTables);
                    setNewFigureTable('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {figuresTables.map((item, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(figuresTables, index, setFiguresTables)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="overwrite"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
            />
            <Label htmlFor="overwrite">Sobrescrever se já existir</Label>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Enviando...' : 'Enviar Documento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}