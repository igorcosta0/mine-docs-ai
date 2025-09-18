import { DocumentType, BaseFields, DocumentRecord } from "@/types";
import { DOC_TYPES, buildPrompt } from "@/config/documentTypes";

/**
 * Classe para processamento avançado de documentos técnicos
 * Inspirada na funcionalidade do arquivo PHP importado
 */
export class DocumentProcessor {
  private documentData: DocumentRecord;

  constructor(documentData: DocumentRecord) {
    this.documentData = documentData;
  }

  /**
   * Valida se o documento contém todos os campos obrigatórios
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.documentData.titulo?.trim()) {
      errors.push("Título é obrigatório");
    }
    
    if (!this.documentData.conteudo?.trim()) {
      errors.push("Conteúdo é obrigatório");
    }
    
    if (!this.documentData.tipo) {
      errors.push("Tipo do documento é obrigatório");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extrai metadados do documento
   */
  extractMetadata() {
    const wordCount = this.documentData.conteudo?.split(/\s+/).length || 0;
    const pageCount = Math.ceil(wordCount / 250); // ~250 palavras por página
    
    return {
      wordCount,
      pageCount,
      type: DOC_TYPES[this.documentData.tipo]?.label || 'Desconhecido',
      createdAt: this.documentData.createdAt,
      updatedAt: this.documentData.updatedAt,
      size: new Blob([this.documentData.conteudo || '']).size
    };
  }

  /**
   * Formata o documento para exibição profissional
   */
  formatForDisplay(): string {
    if (!this.documentData.conteudo) return '';
    
    let formatted = this.documentData.conteudo;
    
    // Adiciona cabeçalho profissional
    const header = this.generateHeader();
    
    // Formata seções
    formatted = this.formatSections(formatted);
    
    // Adiciona rodapé
    const footer = this.generateFooter();
    
    return `${header}\n\n${formatted}\n\n${footer}`;
  }

  /**
   * Gera cabeçalho profissional do documento
   */
  private generateHeader(): string {
    const docType = DOC_TYPES[this.documentData.tipo];
    const date = new Date(this.documentData.createdAt).toLocaleDateString('pt-BR');
    
    return `
═══════════════════════════════════════════════════════════════════
                    ${docType?.label.toUpperCase() || 'DOCUMENTO TÉCNICO'}
═══════════════════════════════════════════════════════════════════

TÍTULO: ${this.documentData.titulo}
TIPO: ${docType?.label || 'N/A'}
DATA: ${date}
ID: ${this.documentData.id}

${docType?.description || ''}

═══════════════════════════════════════════════════════════════════
    `.trim();
  }

  /**
   * Formata seções do documento
   */
  private formatSections(content: string): string {
    // Formata títulos de seções (linhas que terminam com :)
    content = content.replace(/^(.+):$/gm, '\n── $1 ──\n');
    
    // Formata listas
    content = content.replace(/^- /gm, '  • ');
    content = content.replace(/^\* /gm, '  • ');
    
    // Formata números de seções
    content = content.replace(/^(\d+\.)\s/gm, '\n$1 ');
    
    return content;
  }

  /**
   * Gera rodapé do documento
   */
  private generateFooter(): string {
    const metadata = this.extractMetadata();
    
    return `
═══════════════════════════════════════════════════════════════════
                            INFORMAÇÕES DO DOCUMENTO
═══════════════════════════════════════════════════════════════════

Palavras: ${metadata.wordCount} | Páginas: ${metadata.pageCount} | Tamanho: ${this.formatBytes(metadata.size)}
Criado em: ${new Date(metadata.createdAt).toLocaleString('pt-BR')}
Atualizado em: ${new Date(metadata.updatedAt).toLocaleString('pt-BR')}

═══════════════════════════════════════════════════════════════════
    `.trim();
  }

  /**
   * Formata bytes para display legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Exporta o documento em diferentes formatos
   */
  exportToFormat(format: 'txt' | 'md' | 'html'): string {
    const formatted = this.formatForDisplay();
    
    switch (format) {
      case 'txt':
        return formatted;
        
      case 'md':
        return this.convertToMarkdown(formatted);
        
      case 'html':
        return this.convertToHTML(formatted);
        
      default:
        return formatted;
    }
  }

  /**
   * Converte para Markdown
   */
  private convertToMarkdown(content: string): string {
    return content
      .replace(/═{60,}/g, '---')
      .replace(/── (.+) ──/g, '## $1')
      .replace(/^  • /gm, '- ');
  }

  /**
   * Converte para HTML
   */
  private convertToHTML(content: string): string {
    let html = content
      .replace(/═{60,}/g, '<hr>')
      .replace(/── (.+) ──/g, '<h2>$1</h2>')
      .replace(/^  • (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^\s*<li>/gm, '<ul><li>')
      .replace(/<\/li>\s*$/gm, '</li></ul>');

    return `<div class="document-content"><p>${html}</p></div>`;
  }
}

/**
 * Utilitários para processamento de documentos
 */
export class DocumentUtils {
  /**
   * Analisa a qualidade do conteúdo do documento
   */
  static analyzeContentQuality(content: string): {
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 100;

    // Verifica comprimento mínimo
    if (content.length < 100) {
      suggestions.push("Documento muito curto. Considere adicionar mais detalhes.");
      score -= 20;
    }

    // Verifica se tem seções
    if (!content.includes(':') && !content.match(/^\d+\./gm)) {
      suggestions.push("Adicione seções para melhor organização.");
      score -= 15;
    }

    // Verifica se tem listas
    if (!content.includes('-') && !content.includes('•')) {
      suggestions.push("Use listas para melhor legibilidade.");
      score -= 10;
    }

    // Verifica palavras técnicas
    const technicalWords = ['requisito', 'especificação', 'tolerância', 'norma', 'procedimento'];
    const hasTechnicalContent = technicalWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (!hasTechnicalContent) {
      suggestions.push("Considere adicionar mais terminologia técnica apropriada.");
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      suggestions
    };
  }

  /**
   * Gera template básico para tipo de documento
   */
  static generateTemplate(tipo: DocumentType): string {
    const docConfig = DOC_TYPES[tipo];
    
    const baseTemplate = `# ${docConfig.label}

## 1. Informações Gerais
- **Título**: [Inserir título]
- **Autor**: [Inserir autor]
- **Data**: ${new Date().toLocaleDateString('pt-BR')}
- **Normas Aplicáveis**: [Inserir normas]

## 2. Descrição do Projeto
[Inserir descrição detalhada do projeto]

## 3. Especificações Técnicas
`;

    // Adiciona campos específicos do tipo
    const technicalFields = docConfig.technical
      .map(field => `- **${field.label}**: [${field.placeholder || 'Inserir informação'}]`)
      .join('\n');

    const additionalSections = this.getAdditionalSections(tipo);

    return `${baseTemplate}${technicalFields}\n\n${additionalSections}`;
  }

  /**
   * Retorna seções adicionais específicas por tipo
   */
  private static getAdditionalSections(tipo: DocumentType): string {
    switch (tipo) {
      case 'especificacao':
        return `## 4. Critérios de Aceitação
[Definir critérios de aceitação]

## 5. Testes e Inspeção
[Procedimentos de teste e inspeção]

## 6. Instalação e Comissionamento
[Procedimentos de instalação]`;

      case 'folha-dados':
        return `## 4. Características Operacionais
[Condições de operação]

## 5. Manutenção
[Procedimentos de manutenção]

## 6. Documentação Anexa
[Lista de documentos relacionados]`;

      case 'memorial':
        return `## 4. Metodologia
[Metodologia utilizada]

## 5. Justificativas Técnicas
[Justificativas das soluções adotadas]

## 6. Conclusões
[Conclusões e recomendações]`;

      default:
        return `## 4. Informações Adicionais
[Inserir informações relevantes]`;
    }
  }
}