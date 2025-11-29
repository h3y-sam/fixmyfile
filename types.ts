import React from 'react';

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  isNew?: boolean;
  isAi?: boolean; // AI-powered tool
  category: 'pdf' | 'image' | 'video' | 'audio';
  accepts: string; 
  multiple: boolean;
  path: string; // URL path e.g. /pdf-merge
  action: (files: File[], options?: any) => Promise<ProcessedFile | ProcessedFile[]>;
  optionsComponent?: React.FC<ToolOptionsProps>;
}

export interface ToolOptionsProps {
  files: File[];
  options: any;
  setOptions: (opts: any) => void;
}

export interface ProcessedFile {
  data: Blob | Uint8Array | string; // String for URLs/Base64
  filename: string;
  type: string;
}

export interface AiSuggestion {
    message: string;
    toolId: string;
    confidence: number;
}

declare global {
  interface Window {
    PDFLib: any;
    pdfjsLib: any;
    JSZip: any;
    saveAs: any;
    mammoth: any;
    html2pdf: any;
    XLSX: any;
    PptxGenJS: any;
    fabric: any;
    Tesseract: any;
  }
}

export enum ProcessingStatus {
  IDLE = 'idle',
  ANALYZING = 'analyzing', // AI Analysis
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  ERROR = 'error'
}