import React from 'react';
import { Tool, ToolOptionsProps } from './types';
import * as PDFService from './services/pdfService';
import * as ImageService from './services/imageService';
import * as VideoService from './services/videoService';
import * as OcrService from './services/ocrService';
import PdfEditor from './components/PdfEditor';
import ImageEditor from './components/ImageEditor';
import PageOrganizer from './components/PageOrganizer';

// --- Reused Options Components ---

const RangeInput: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
  <div className="w-full">
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Page Range</label>
    <input 
      type="text" 
      value={options.range || ''} 
      onChange={(e) => setOptions({ ...options, range: e.target.value })}
      placeholder="e.g. 1-5, 8, 11-13"
      className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 border focus:border-brand-primary outline-none text-gray-800 dark:text-white"
    />
  </div>
);

const PasswordInput: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
        <input 
            type="password" 
            value={options.password || ''} 
            onChange={(e) => setOptions({ ...options, password: e.target.value })}
            className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 border focus:border-brand-primary outline-none text-gray-800 dark:text-white"
        />
    </div>
);

const WatermarkOptions: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full space-y-4">
        <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Watermark Text</label>
            <input 
                type="text" 
                value={options.text || ''} 
                onChange={(e) => setOptions({ ...options, text: e.target.value })}
                placeholder="CONFIDENTIAL"
                className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 border focus:border-brand-primary outline-none text-gray-800 dark:text-white"
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Opacity ({options.opacity || 50}%)</label>
            <input 
                type="range" 
                min="10" 
                max="100" 
                value={options.opacity || 50} 
                onChange={(e) => setOptions({ ...options, opacity: parseInt(e.target.value) })}
                className="w-full accent-brand-primary"
            />
        </div>
    </div>
);

const CompressPdfOptions: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full space-y-4">
        <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Compression Quality ({options.quality || 50}%)</label>
            <input 
                type="range" 
                min="10" 
                max="100" 
                value={options.quality || 50} 
                onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
                className="w-full accent-brand-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Lower quality means smaller file size.</p>
        </div>
    </div>
);

const CompressImageOptions: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full space-y-4">
        <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quality ({options.quality || 70}%)</label>
            <input 
                type="range" 
                min="10" 
                max="100" 
                value={options.quality || 70} 
                onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
                className="w-full accent-brand-primary"
            />
        </div>
    </div>
);

const ConvertImageOptions: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full">
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target Format</label>
         <div className="flex gap-4">
             {['png', 'jpeg', 'webp'].map(fmt => (
                 <label key={fmt} className={`flex-1 border rounded-xl p-3 flex items-center justify-center cursor-pointer transition-all ${options.format === fmt ? 'border-brand-primary bg-brand-light text-brand-primary font-bold' : 'border-gray-200 text-gray-600'}`}>
                     <input type="radio" name="format" value={fmt} checked={options.format === fmt} onChange={() => setOptions({ ...options, format: fmt })} className="hidden" />
                     {fmt.toUpperCase()}
                 </label>
             ))}
         </div>
    </div>
);

const ResizeImageOptions: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full space-y-4">
        <div className="flex gap-4">
            <div className="flex-1">
                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Width (px)</label>
                 <input type="number" value={options.width || ''} onChange={(e) => setOptions({...options, width: parseInt(e.target.value), percentage: null})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="Auto" />
            </div>
            <div className="flex-1">
                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Height (px)</label>
                 <input type="number" value={options.height || ''} onChange={(e) => setOptions({...options, height: parseInt(e.target.value), percentage: null})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="Auto" />
            </div>
        </div>
        <div>
             <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Or Scale Percentage</label>
             <input type="range" min="10" max="200" value={options.percentage || 100} onChange={(e) => setOptions({...options, percentage: parseInt(e.target.value), width: null, height: null})} className="w-full accent-brand-primary" />
             <div className="text-right text-xs text-gray-500">{options.percentage || 100}%</div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={options.maintainAspectRatio !== false} onChange={(e) => setOptions({...options, maintainAspectRatio: e.target.checked})} />
            Maintain Aspect Ratio
        </label>
    </div>
);

const SearchOptions: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search Query</label>
        <input 
            type="text" 
            value={options.query || ''} 
            onChange={(e) => setOptions({ ...options, query: e.target.value })}
            placeholder="Text to find..."
            className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 border focus:border-brand-primary outline-none text-gray-800 dark:text-white"
        />
    </div>
);

const PageNumberOptions: React.FC<ToolOptionsProps> = ({ options, setOptions }) => (
    <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Position</label>
        <select 
            value={options.position || 'bottom-center'} 
            onChange={(e) => setOptions({ ...options, position: e.target.value })}
            className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 border focus:border-brand-primary outline-none text-gray-800 dark:text-white"
        >
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
        </select>
    </div>
);


// Wrappers for Editor
const EditPdfOptions: React.FC<ToolOptionsProps> = (props) => (
    <div className="h-[70vh] w-full bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
        <PdfEditor {...props} mode="edit" />
    </div>
);

const SignPdfOptions: React.FC<ToolOptionsProps> = (props) => (
    <div className="h-[70vh] w-full bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
        <PdfEditor {...props} mode="sign" />
    </div>
);

const PhotoEditorWrapper: React.FC<ToolOptionsProps> = (props) => (
    <div className="h-full w-full">
        <ImageEditor {...props} />
    </div>
);

export const TOOLS: Tool[] = [
  // --- PDF TOOLS ---
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one single document.',
    icon: 'fa-layer-group',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: true,
    path: '/tool/merge-pdf',
    action: PDFService.mergePDFs
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    description: 'Separate pages from a PDF file.',
    icon: 'fa-scissors',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/split-pdf',
    action: PDFService.splitPDF,
    optionsComponent: RangeInput
  },
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce file size while maintaining quality.',
    icon: 'fa-compress-arrows-alt',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    isAi: true,
    path: '/tool/compress-pdf',
    action: PDFService.compressPdf,
    optionsComponent: CompressPdfOptions
  },
  {
    id: 'summarize-pdf',
    title: 'Summarize PDF',
    description: 'Get an instant AI summary of your document.',
    icon: 'fa-file-alt',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    isAi: true,
    path: '/tool/summarize-pdf',
    action: PDFService.summarizePdf
  },
  {
    id: 'edit-pdf',
    title: 'Edit PDF',
    description: 'Add text, shapes, highlight and comments.',
    icon: 'fa-pen-to-square',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/edit-pdf',
    action: PDFService.editPdf,
    optionsComponent: EditPdfOptions
  },
  {
    id: 'sign-pdf',
    title: 'Sign PDF',
    description: 'Add digital signatures to your documents.',
    icon: 'fa-signature',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/sign-pdf',
    action: PDFService.editPdf,
    optionsComponent: SignPdfOptions
  },
  {
    id: 'organize-pdf',
    title: 'Organize PDF',
    description: 'Sort, rotate and delete pages.',
    icon: 'fa-sort',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/organize-pdf',
    action: PDFService.organizePdf,
    optionsComponent: PageOrganizer
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert PDF to editable DOCX text.',
    icon: 'fa-file-word',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/pdf-to-word',
    action: PDFService.pdfToWord
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel',
    description: 'Convert PDF tables to CSV/Excel.',
    icon: 'fa-file-csv',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/pdf-to-excel',
    action: PDFService.pdfToExcel
  },
  {
    id: 'pdf-to-ppt',
    title: 'PDF to PPT',
    description: 'Convert PDF slides to PowerPoint.',
    icon: 'fa-file-powerpoint',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/pdf-to-ppt',
    action: PDFService.pdfToPowerPoint
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF to JPG',
    description: 'Convert PDF pages to JPG images.',
    icon: 'fa-file-image',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/pdf-to-jpg',
    action: (f) => PDFService.pdfToImages(f, { format: 'jpeg' })
  },
  {
    id: 'pdf-to-png',
    title: 'PDF to PNG',
    description: 'Convert PDF pages to PNG images.',
    icon: 'fa-file-image',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/pdf-to-png',
    action: (f) => PDFService.pdfToImages(f, { format: 'png' })
  },
   {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert DOC/DOCX to PDF.',
    icon: 'fa-file-word',
    category: 'pdf',
    accepts: '.doc,.docx',
    multiple: false,
    path: '/tool/word-to-pdf',
    action: PDFService.wordToPdf
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Convert Spreadsheets to PDF.',
    icon: 'fa-file-excel',
    category: 'pdf',
    accepts: '.xlsx, .xls, .csv',
    multiple: false,
    path: '/tool/excel-to-pdf',
    action: PDFService.excelToPdf
  },
  {
    id: 'ppt-to-pdf',
    title: 'PPT to PDF',
    description: 'Convert PowerPoint to PDF.',
    icon: 'fa-file-powerpoint',
    category: 'pdf',
    accepts: '.pptx, .ppt',
    multiple: false,
    path: '/tool/ppt-to-pdf',
    action: PDFService.pptToPdf
  },
  {
    id: 'ocr-pdf',
    title: 'OCR Scanner',
    description: 'Extract text from scanned images/PDFs.',
    icon: 'fa-eye',
    category: 'pdf',
    accepts: 'image/*',
    multiple: false,
    isAi: true,
    path: '/tool/ocr-pdf',
    action: OcrService.extractText
  },
  {
    id: 'watermark-pdf',
    title: 'Watermark',
    description: 'Add text watermark to PDF.',
    icon: 'fa-stamp',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/watermark-pdf',
    action: PDFService.watermarkPDF,
    optionsComponent: WatermarkOptions
  },
  {
    id: 'page-numbers',
    title: 'Page Numbers',
    description: 'Add page numbers to document.',
    icon: 'fa-list-ol',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/page-numbers',
    action: PDFService.addPageNumbers,
    optionsComponent: PageNumberOptions
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Encrypt PDF with a password.',
    icon: 'fa-lock',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/protect-pdf',
    action: PDFService.protectPDF,
    optionsComponent: PasswordInput
  },
  {
    id: 'unlock-pdf',
    title: 'Unlock PDF',
    description: 'Remove password protection.',
    icon: 'fa-unlock',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/unlock-pdf',
    action: PDFService.unlockPdf,
    optionsComponent: PasswordInput
  },
  {
    id: 'search-pdf',
    title: 'Search PDF',
    description: 'Find text inside PDF documents.',
    icon: 'fa-search',
    category: 'pdf',
    accepts: 'application/pdf',
    multiple: false,
    path: '/tool/search-pdf',
    action: PDFService.searchPdfText,
    optionsComponent: SearchOptions
  },

  // --- IMAGE TOOLS ---
  {
    id: 'photo-editor',
    title: 'Pro Image Editor',
    description: 'Advanced filters, layers, crop & draw.',
    icon: 'fa-wand-magic-sparkles',
    category: 'image',
    accepts: 'image/*',
    multiple: false,
    path: '/tool/photo-editor',
    action: ImageService.editImage,
    optionsComponent: PhotoEditorWrapper
  },
  {
    id: 'analyze-image',
    title: 'Analyze Image',
    description: 'Get an AI description of your photo.',
    icon: 'fa-robot',
    category: 'image',
    accepts: 'image/*',
    multiple: false,
    isAi: true,
    path: '/tool/analyze-image',
    action: ImageService.analyzeImageContent
  },
  {
    id: 'convert-image',
    title: 'Convert Image',
    description: 'Convert between JPG, PNG, WEBP.',
    icon: 'fa-exchange-alt',
    category: 'image',
    accepts: 'image/*',
    multiple: true,
    path: '/tool/convert-image',
    action: ImageService.convertImage,
    optionsComponent: ConvertImageOptions
  },
  {
    id: 'resize-image',
    title: 'Resize Image',
    description: 'Change dimensions or scale.',
    icon: 'fa-ruler-combined',
    category: 'image',
    accepts: 'image/*',
    multiple: false, // Could be true if we batch it
    path: '/tool/resize-image',
    action: ImageService.resizeImage,
    optionsComponent: ResizeImageOptions
  },
  {
    id: 'compress-image',
    title: 'Compress Image',
    description: 'Smart compression for JPG/PNG.',
    icon: 'fa-compress',
    category: 'image',
    accepts: 'image/*',
    multiple: true,
    path: '/tool/compress-image',
    action: ImageService.compressImage,
    optionsComponent: CompressImageOptions
  },
  {
    id: 'images-to-pdf',
    title: 'Images to PDF',
    description: 'Convert multiple photos into a single PDF.',
    icon: 'fa-file-pdf',
    category: 'image',
    accepts: 'image/*',
    multiple: true,
    path: '/tool/images-to-pdf',
    action: ImageService.imagesToPdf
  },
  // AI TOOLS
  {
    id: 'remove-bg',
    title: 'Remove BG',
    description: 'Remove image backgrounds instantly.',
    icon: 'fa-eraser',
    category: 'image',
    accepts: 'image/*',
    multiple: false,
    isAi: true,
    path: '/tool/remove-bg',
    action: ImageService.removeBackground
  },
  {
    id: 'ai-upscale',
    title: 'AI Upscaler',
    description: 'Enhance resolution and quality.',
    icon: 'fa-expand',
    category: 'image',
    accepts: 'image/*',
    multiple: false,
    isAi: true,
    path: '/tool/ai-upscale',
    action: ImageService.aiUpscale
  },
  {
    id: 'style-transfer',
    title: 'Style Transfer',
    description: 'Turn photos into artistic paintings.',
    icon: 'fa-palette',
    category: 'image',
    accepts: 'image/*',
    multiple: false,
    isAi: true,
    path: '/tool/style-transfer',
    action: ImageService.aiStyleTransfer
  },
  
  // --- VIDEO TOOLS ---
  {
    id: 'video-compress',
    title: 'Compress Video',
    description: 'Reduce video size for sharing.',
    icon: 'fa-video',
    category: 'video',
    accepts: 'video/*',
    multiple: false,
    path: '/tool/video-compress',
    action: VideoService.compressVideo
  },
  {
    id: 'video-to-gif',
    title: 'Video to GIF',
    description: 'Convert clips to animated GIFs.',
    icon: 'fa-film',
    category: 'video',
    accepts: 'video/*',
    multiple: false,
    path: '/tool/video-to-gif',
    action: VideoService.convertToGif
  },
  {
    id: 'video-audio',
    title: 'Extract Audio',
    description: 'Get MP3 from MP4 video.',
    icon: 'fa-music',
    category: 'audio',
    accepts: 'video/*',
    multiple: false,
    path: '/tool/extract-audio',
    action: VideoService.extractAudio
  }
];
