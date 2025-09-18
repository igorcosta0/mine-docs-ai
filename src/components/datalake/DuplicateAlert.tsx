import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle, Copy, Calendar } from "lucide-react";
import { LakeItem } from "@/lib/datalake";
import { DuplicateCheckResult, DuplicateAction } from "@/lib/duplicateDetection";

interface DuplicateAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: DuplicateAction, replacedItemId?: string) => void;
  fileName: string;
  duplicateResult: DuplicateCheckResult;
}

export const DuplicateAlert: React.FC<DuplicateAlertProps> = ({
  isOpen,
  onClose,
  onAction,
  fileName,
  duplicateResult
}) => {
  const { hasExactDuplicate, hasSimilar, duplicates, similar } = duplicateResult;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDocumentItem = (item: LakeItem, isExactDuplicate: boolean = false) => (
    <Card key={item.id} className="mb-2">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{item.title}</span>
                {isExactDuplicate && (
                  <Badge variant="destructive" className="text-xs">
                    <Copy className="h-3 w-3 mr-1" />
                    Idêntico
                  </Badge>
                )}
                {!isExactDuplicate && (
                  <Badge variant="secondary" className="text-xs">
                    Similar
                  </Badge>
                )}
              </div>
              
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.updated_at)}
                </div>
                {item.doc_type && (
                  <Badge variant="outline" className="text-xs">
                    {item.doc_type}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {isExactDuplicate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction('replace', item.id)}
              className="text-xs"
            >
              Substituir Este
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDialogTitle>
              {hasExactDuplicate ? 'Documento Duplicado Detectado' : 'Documentos Similares Encontrados'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {hasExactDuplicate ? (
              <>
                O arquivo <strong>{fileName}</strong> é idêntico a {duplicates.length} documento(s) já existente(s) no Data Lake.
              </>
            ) : (
              <>
                Encontramos {similar.length} documento(s) com nomes similares a <strong>{fileName}</strong>.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {hasExactDuplicate && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-destructive">
                Duplicatas Exatas ({duplicates.length})
              </h4>
              {duplicates.map(item => renderDocumentItem(item, true))}
            </div>
          )}

          {hasSimilar && similar.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                Documentos Similares ({similar.length})
              </h4>
              {similar.slice(0, 5).map(item => renderDocumentItem(item, false))}
              {similar.length > 5 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ... e mais {similar.length - 5} documento(s) similar(es)
                </p>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={() => onAction('cancel')}>
            Cancelar Upload
          </AlertDialogCancel>
          
          <Button 
            variant="outline" 
            onClick={() => onAction('keep_both')}
          >
            Manter Ambos
          </Button>
          
          {hasExactDuplicate && duplicates.length === 1 && (
            <Button 
              variant="default"
              onClick={() => onAction('replace', duplicates[0].id)}
            >
              Substituir Existente
            </Button>
          )}
          
          {!hasExactDuplicate && (
            <Button 
              variant="default"
              onClick={() => onAction('keep_both')}
            >
              Continuar Upload
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};