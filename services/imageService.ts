import { ProcessedFile } from '../types';
import * as GeminiService from './geminiService';

const { PDFLib, JSZip } = window;

// Helper to load image to canvas
const loadImageToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            } else {
                reject(new Error("Could not get canvas context"));
            }
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
};

export const analyzeImageContent = async (files: File[]): Promise<ProcessedFile> => {
    if (files.length !== 1) throw new Error("Select a single image.");
    const file = files[0];
    
    const description = await GeminiService.analyzeImage(file, "Describe this image in detail and suggest improvements.");
    
    return {
        data: new Blob([description], { type: 'text/plain' }),
        filename: `analysis_${file.name.split('.')[0]}.txt`,
        type: 'text/plain'
    };
};

export const compressImage = async (files: File[], options: { quality: number }): Promise<ProcessedFile> => {
    // Handle multiple files if passed, returning a ZIP if > 1, else single file
    if (files.length > 1) {
        const zip = new JSZip();
        const quality = (options.quality || 70) / 100;
        
        for (const file of files) {
            const canvas = await loadImageToCanvas(file);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (blob) zip.file(file.name, blob);
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        return {
            data: content,
            filename: `compressed_images.zip`,
            type: 'application/zip'
        };
    }

    const file = files[0];
    const canvas = await loadImageToCanvas(file);
    const quality = (options.quality || 70) / 100;
    
    const blob = await new Promise<Blob | null>(resolve => 
        canvas.toBlob(resolve, 'image/jpeg', quality)
    );

    if (!blob) throw new Error("Compression failed");

    return {
        data: blob,
        filename: `compressed_${file.name.replace(/\.[^/.]+$/, "")}.jpg`,
        type: 'image/jpeg'
    };
};

export const resizeImage = async (files: File[], options: { width: number, height: number, percentage: number, maintainAspectRatio: boolean }): Promise<ProcessedFile> => {
    // Handle single file for now, but scalable to batch
    const file = files[0];
    const img = new Image();
    
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });

    const canvas = document.createElement('canvas');
    let targetWidth = options.width;
    let targetHeight = options.height;

    if (options.percentage) {
        targetWidth = img.width * (options.percentage / 100);
        targetHeight = img.height * (options.percentage / 100);
    } else {
         if (!targetWidth) targetWidth = img.width;
         if (!targetHeight) targetHeight = img.height;

        if (options.maintainAspectRatio) {
            const ratio = img.width / img.height;
            if (options.width && !options.height) {
                targetHeight = targetWidth / ratio;
            } else if (!options.width && options.height) {
                targetWidth = targetHeight * ratio;
            }
        }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, file.type));
    
    return {
        data: blob!,
        filename: `resized_${file.name}`,
        type: file.type
    };
};

export const convertImage = async (files: File[], options: { format: 'jpeg' | 'png' | 'webp' }): Promise<ProcessedFile> => {
    if (files.length > 1) {
        const zip = new JSZip();
        for (const file of files) {
             const canvas = await loadImageToCanvas(file);
             const mime = `image/${options.format}`;
             const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, 0.9));
             if (blob) zip.file(`${file.name.split('.')[0]}.${options.format}`, blob);
        }
        const content = await zip.generateAsync({ type: "blob" });
         return {
            data: content,
            filename: `converted_images.zip`,
            type: 'application/zip'
        };
    }

    const file = files[0];
    const canvas = await loadImageToCanvas(file);
    const mimeType = `image/${options.format}`;
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, 0.9));

    return {
        data: blob!,
        filename: `converted_${file.name.replace(/\.[^/.]+$/, "")}.${options.format}`,
        type: mimeType
    };
};

export const imagesToPdf = async (files: File[]): Promise<ProcessedFile> => {
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
        } else {
            // Convert others to PNG via canvas first
            const canvas = await loadImageToCanvas(file);
            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
            const buff = await blob!.arrayBuffer();
            image = await pdfDoc.embedPng(buff);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return {
        data: pdfBytes,
        filename: 'images_combined.pdf',
        type: 'application/pdf'
    };
};

// --- AI Mock Services ---

export const removeBackground = async (files: File[]): Promise<ProcessedFile> => {
    // Mock: Returns original for now, simulating AI processing time
    await new Promise(r => setTimeout(r, 2000));
    const file = files[0];
    // In real app, call API or run on-device model
    return {
        data: file,
        filename: `nobg_${file.name}`,
        type: file.type
    };
};

export const aiUpscale = async (files: File[]): Promise<ProcessedFile> => {
    await new Promise(r => setTimeout(r, 2500));
    const file = files[0];
    // Logic: Doubles dimensions (mock)
    const canvas = await loadImageToCanvas(file);
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width * 2;
    newCanvas.height = canvas.height * 2;
    const ctx = newCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
    
    const blob = await new Promise<Blob | null>(r => newCanvas.toBlob(r, file.type));
    return {
        data: blob!,
        filename: `upscaled_${file.name}`,
        type: file.type
    };
};

export const aiStyleTransfer = async (files: File[]): Promise<ProcessedFile> => {
    await new Promise(r => setTimeout(r, 3000));
    const file = files[0];
    // Mock: Applies a sepia filter to simulate "style"
    const canvas = await loadImageToCanvas(file);
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'sepia(60%) contrast(120%)';
    ctx.drawImage(canvas, 0, 0);
    
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, file.type));
    return {
        data: blob!,
        filename: `styled_${file.name}`,
        type: file.type
    };
};

export const aiRemoveObject = async (files: File[]): Promise<ProcessedFile> => {
    await new Promise(r => setTimeout(r, 2000));
    const file = files[0];
    // In a real implementation, this would send the file and a mask to a backend
    return {
        data: file,
        filename: `clean_${file.name}`,
        type: file.type
    };
};

export const editImage = async (files: File[], options: { imageDataUrl: string }): Promise<ProcessedFile> => {
    if (!options.imageDataUrl) throw new Error("No image data received.");
    const res = await fetch(options.imageDataUrl);
    const blob = await res.blob();
    const file = files[0];
    return {
        data: blob,
        filename: `edited_${file.name}`,
        type: 'image/png' 
    };
};
