import { ProcessedFile } from '../types';

export const extractText = async (files: File[], options: { language?: string }): Promise<ProcessedFile> => {
    const file = files[0];
    const lang = options.language || 'eng';

    // Basic implementation for images. For PDFs, we'd convert to image first (omitted for brevity)
    // Assuming input is an image or converted PDF page
    
    let imageUrl = '';
    if (file.type === 'application/pdf') {
        // Mock: In a real app we'd render the PDF page to canvas here
        throw new Error("Direct PDF OCR requires converting pages to images first. Please use PDF to JPG then OCR.");
    } else {
        imageUrl = URL.createObjectURL(file);
    }

    const worker = window.Tesseract.createWorker({
        logger: (m: any) => console.log(m)
    });

    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();

    return {
        data: new Blob([text], { type: 'text/plain' }),
        filename: `${file.name}_ocr.txt`,
        type: 'text/plain'
    };
};