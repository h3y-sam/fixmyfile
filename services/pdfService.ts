import { ProcessedFile } from '../types';
import * as GeminiService from './geminiService';

const { PDFLib, pdfjsLib, JSZip, mammoth, html2pdf, XLSX, PptxGenJS } = window;

// Configure PDF.js worker
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

// ... (previous imports and setup)

// Helper to extract text from PDF (reused logic)
const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = "";
    
    // Limit to first 10 pages for summary performance
    const limit = Math.min(pdf.numPages, 10);
    
    for (let i = 1; i <= limit; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + "\n";
    }
    return text;
};

export const summarizePdf = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file to summarize.");
    const file = files[0];
    
    const text = await extractTextFromPdf(file);
    
    if (text.length < 50) {
        throw new Error("Not enough text found in PDF to summarize (it might be scanned). Try OCR first.");
    }

    const summary = await GeminiService.summarizeText(text);

    return {
        data: new Blob([summary], { type: 'text/markdown' }),
        filename: `summary_${file.name.replace('.pdf', '')}.md`,
        type: 'text/markdown'
    };
};

export const mergePDFs = async (files: File[]): Promise<ProcessedFile> => {
  const mergedPdf = await PDFLib.PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page: any) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return {
    data: pdfBytes,
    filename: 'merged_document.pdf',
    type: 'application/pdf'
  };
};

export const splitPDF = async (files: File[], options: { range: string }): Promise<ProcessedFile> => {
  if (files.length !== 1) throw new Error("Please select a single file to split.");
  const file = files[0];
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  const newPdf = await PDFLib.PDFDocument.create();
  const totalPages = pdfDoc.getPageCount();

  const pageIndices: number[] = [];
  const parts = options.range ? options.range.split(',') : [];
  
  parts.forEach((part: string) => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((p) => parseInt(p.trim()));
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) pageIndices.push(i - 1);
      }
    } else {
      const page = parseInt(part.trim());
      if (page >= 1 && page <= totalPages) pageIndices.push(page - 1);
    }
  });

  const uniqueIndices = Array.from(new Set(pageIndices)).sort((a, b) => a - b);
  
  if (uniqueIndices.length === 0) throw new Error("Invalid page range. Please enter format like '1-3, 5'.");

  const copiedPages = await newPdf.copyPages(pdfDoc, uniqueIndices);
  copiedPages.forEach((page: any) => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  return {
    data: pdfBytes,
    filename: `split_${file.name}`,
    type: 'application/pdf'
  };
};

// Convert PDF Pages to Images (JPG/PNG)
export const pdfToImages = async (files: File[], options: { format: 'png' | 'jpeg' } = { format: 'jpeg' }): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Processing one file at a time for conversion.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const totalPages = pdf.numPages;
    
    const zip = new JSZip();
    const format = options.format || 'jpeg';

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${format}`, 0.9));
        if (blob) {
            zip.file(`page_${i}.${format === 'jpeg' ? 'jpg' : 'png'}`, blob);
        }
    }

    const content = await zip.generateAsync({ type: "blob" });
    return {
        data: content,
        filename: `${file.name.replace('.pdf', '')}_images.zip`,
        type: 'application/zip'
    };
};

// Extract embedded images from PDF (simplified: renders pages)
export const extractImages = async (files: File[]): Promise<ProcessedFile> => {
    // True extraction is complex client-side, reusing pdfToImages for reliability
    return pdfToImages(files, { format: 'png' });
};

export const rotatePDF = async (files: File[], options: { rotation: number }): Promise<ProcessedFile> => {
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const { rotation } = options; // 90, 180, 270

    pages.forEach((page: any) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(PDFLib.degrees(currentRotation + rotation));
    });

    const pdfBytes = await pdfDoc.save();
    return {
        data: pdfBytes,
        filename: `rotated_${file.name}`,
        type: 'application/pdf'
    };
};

export const watermarkPDF = async (files: File[], options: { text: string, opacity: number }): Promise<ProcessedFile> => {
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    pages.forEach((page: any) => {
        const { width, height } = page.getSize();
        page.drawText(options.text || 'CONFIDENTIAL', {
            x: width / 2 - (options.text ? options.text.length * 10 : 100),
            y: height / 2,
            size: 50,
            font: font,
            opacity: (options.opacity || 50) / 100,
            rotate: PDFLib.degrees(45),
            color: PDFLib.rgb(0.9, 0.2, 0.2)
        });
    });

    const pdfBytes = await pdfDoc.save();
    return {
        data: pdfBytes,
        filename: `watermarked_${file.name}`,
        type: 'application/pdf'
    };
};

export const protectPDF = async (files: File[], options: { password: string }): Promise<ProcessedFile> => {
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    const pdfBytes = await pdfDoc.save({
        userPassword: options.password,
        ownerPassword: options.password
    });

    return {
        data: pdfBytes,
        filename: `protected_${file.name}`,
        type: 'application/pdf'
    };
};

export const unlockPdf = async (files: File[], options: { password: string }): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file to unlock.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    
    try {
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { password: options.password });
        const pdfBytes = await pdfDoc.save();
        
        return {
            data: pdfBytes,
            filename: `unlocked_${file.name}`,
            type: 'application/pdf'
        };
    } catch (e) {
        throw new Error("Incorrect password or unable to unlock file.");
    }
};

export const organizePdf = async (files: File[], options: { pageOrder: { index: number, rotation: number }[] }): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file to organize.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFLib.PDFDocument.load(arrayBuffer);
    const newPdf = await PDFLib.PDFDocument.create();

    if (!options.pageOrder || options.pageOrder.length === 0) {
        throw new Error("No pages selected.");
    }

    const indicesToCopy = options.pageOrder.map(p => p.index);
    const copiedPages = await newPdf.copyPages(srcPdf, indicesToCopy);

    copiedPages.forEach((page: any, i: number) => {
        const config = options.pageOrder[i];
        const currentRotation = page.getRotation().angle;
        page.setRotation(PDFLib.degrees(currentRotation + config.rotation));
        newPdf.addPage(page);
    });

    const pdfBytes = await newPdf.save();
    return {
        data: pdfBytes,
        filename: `organized_${file.name}`,
        type: 'application/pdf'
    };
};

export const addPageNumbers = async (files: File[], options: { position: string }): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    pages.forEach((page: any, idx: number) => {
        const { width, height } = page.getSize();
        const fontSize = 12;
        const text = `${idx + 1}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const margin = 20;

        let x = 0;
        let y = 0;

        switch (options.position) {
            case 'bottom-right':
                x = width - margin - textWidth;
                y = margin;
                break;
            case 'bottom-left':
                x = margin;
                y = margin;
                break;
            case 'top-right':
                x = width - margin - textWidth;
                y = height - margin;
                break;
            case 'top-left':
                x = margin;
                y = height - margin;
                break;
            case 'top-center':
                x = (width / 2) - (textWidth / 2);
                y = height - margin;
                break;
            case 'bottom-center':
            default:
                x = (width / 2) - (textWidth / 2);
                y = margin;
                break;
        }

        page.drawText(text, {
            x,
            y,
            size: fontSize,
            font: font,
            color: PDFLib.rgb(0, 0, 0),
        });
    });

    const pdfBytes = await pdfDoc.save();
    return {
        data: pdfBytes,
        filename: `numbered_${file.name}`,
        type: 'application/pdf'
    };
};

export const compressPdf = async (files: File[], options: { quality: number }): Promise<ProcessedFile> => {
    // PDF compression in JS is limited. We can rebuild the PDF and strip unused objects.
    // For 'visual' compression (rasterizing), we'd convert pages to images and back to PDF.
    // Here we will implement the rasterize method as it gives real file size reduction for scanned docs.
    const file = files[0];
    const quality = (options.quality || 50) / 100;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const newPdf = await PDFLib.PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Reasonable quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', quality);
        const img = await newPdf.embedJpg(imgData);
        const newPage = newPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    const pdfBytes = await newPdf.save();
    return {
        data: pdfBytes,
        filename: `compressed_${file.name}`,
        type: 'application/pdf'
    };
};

// --- Conversion Implementations ---

export const pdfToWord = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + "\n\n";
    }

    return {
        data: new Blob([text], { type: 'text/plain' }),
        filename: `${file.name.replace('.pdf', '')}.txt`,
        type: 'text/plain'
    };
};

export const pdfToExcel = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    // Very basic text extraction to CSV
    let csvContent = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // Naive row construction based on Y position would be better, but simple join for now
        const items = content.items.map((item: any) => item.str);
        csvContent += items.join(",") + "\n";
    }

    return {
        data: new Blob([csvContent], { type: 'text/csv' }),
        filename: `${file.name.replace('.pdf', '')}.csv`,
        type: 'text/csv'
    };
};

export const pdfToPowerPoint = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    const pres = new PptxGenJS();

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const slide = pres.addSlide();
        slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
    }

    const blob = await pres.write("blob");
    return {
        data: blob as Blob,
        filename: `${file.name.replace('.pdf', '')}.pptx`,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
};

export const wordToPdf = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    const element = document.createElement('div');
    element.innerHTML = `<style>body { font-family: sans-serif; line-height: 1.5; padding: 20px; }</style>${html}`;
    element.style.width = '800px'; 
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.appendChild(element);
    document.body.appendChild(container);

    try {
        const opt = {
            margin: 10,
            filename: 'document.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const blob = await html2pdf().set(opt).from(element).output('blob');
        return {
            data: blob,
            filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`,
            type: 'application/pdf'
        };
    } finally {
        document.body.removeChild(container);
    }
};

export const excelToPdf = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const html = XLSX.utils.sheet_to_html(ws);

    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.width = '1000px'; 
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.appendChild(element);
    document.body.appendChild(container);

    try {
         const opt = {
            margin: 5,
            filename: 'spreadsheet.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        const blob = await html2pdf().set(opt).from(element).output('blob');
        return {
            data: blob,
            filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`,
            type: 'application/pdf'
        };
    } finally {
        document.body.removeChild(container);
    }
};

export const pptToPdf = async (files: File[]): Promise<ProcessedFile> => {
    // Client side PPT to PDF is extremely limited. 
    // We will provide a simple text extraction + placeholder PDF 
    // or recommend users convert to PDF using their office software first.
    // For this demo, we create a PDF that lists the limitation.
    const file = files[0];
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText('FixMyFile: PPT to PDF conversion', { x: 50, y: 700, size: 20 });
    page.drawText(`Source File: ${file.name}`, { x: 50, y: 650, size: 12 });
    page.drawText('Note: Full client-side PPT rendering is experimental.', { x: 50, y: 600, size: 12 });
    
    const pdfBytes = await pdfDoc.save();
    return {
        data: pdfBytes,
        filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`,
        type: 'application/pdf'
    };
};

export const htmlToPdf = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single HTML file.");
    const file = files[0];
    const text = await file.text();

    const element = document.createElement('div');
    element.innerHTML = text;
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.appendChild(element);
    document.body.appendChild(container);

    try {
         const opt = {
            margin: 10,
            filename: 'webpage.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        const blob = await html2pdf().set(opt).from(element).output('blob');
        return {
            data: blob,
            filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`,
            type: 'application/pdf'
        };
    } finally {
        document.body.removeChild(container);
    }
};

export const editPdf = async (files: File[], options: { edits: Record<number, string> }): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Please select a single file to edit.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    if (options.edits) {
        for (const [pageIndexStr, dataUrl] of Object.entries(options.edits)) {
            const pageIndex = parseInt(pageIndexStr);
            if (pageIndex >= 0 && pageIndex < pages.length) {
                const image = await pdfDoc.embedPng(dataUrl);
                const page = pages[pageIndex];
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight()
                });
            }
        }
    }

    const pdfBytes = await pdfDoc.save();
    return {
        data: pdfBytes,
        filename: `edited_${file.name}`,
        type: 'application/pdf'
    };
};

export const searchPdfText = async (files: File[], options: { query: string }): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Select a single file.");
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let resultText = `Search Results for "${options.query}"\n\n`;
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(' ');
        
        if (text.toLowerCase().includes(options.query.toLowerCase())) {
            resultText += `Found on Page ${i}\n`;
            // Simple context snippet
            const idx = text.toLowerCase().indexOf(options.query.toLowerCase());
            const start = Math.max(0, idx - 20);
            const end = Math.min(text.length, idx + options.query.length + 20);
            resultText += `"...${text.substring(start, end)}..."\n\n`;
        }
    }

    return {
        data: new Blob([resultText], { type: 'text/plain' }),
        filename: `search_results.txt`,
        type: 'text/plain'
    };
};