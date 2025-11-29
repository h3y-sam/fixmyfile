import { AiSuggestion } from '../types';

export const analyzeFiles = async (files: File[]): Promise<AiSuggestion[]> => {
    // Simulate AI Latency
    await new Promise(r => setTimeout(r, 1500));
    
    const suggestions: AiSuggestion[] = [];
    const file = files[0];
    const sizeMb = file.size / (1024 * 1024);

    if (files.length > 1 && file.type === 'application/pdf') {
        suggestions.push({
            message: "It looks like you have multiple PDFs. Would you like to merge them?",
            toolId: 'merge-pdf',
            confidence: 0.95
        });
    }

    if (sizeMb > 5) {
        suggestions.push({
            message: `This file is large (${sizeMb.toFixed(1)}MB). We recommend compressing it.`,
            toolId: file.type.includes('pdf') ? 'compress-pdf' : 'compress-image',
            confidence: 0.9
        });
    }

    if (file.type === 'application/pdf') {
        suggestions.push({
            message: "Convert this PDF to an editable Word document?",
            toolId: 'pdf-to-word',
            confidence: 0.6
        });
        suggestions.push({
            message: "Extract text from this document using OCR?",
            toolId: 'ocr-pdf',
            confidence: 0.7
        });
    }

    if (file.type.startsWith('image/')) {
        suggestions.push({
            message: "Enhance image quality and lighting?",
            toolId: 'enhance-photo',
            confidence: 0.8
        });
        suggestions.push({
            message: "Remove the background from this image?",
            toolId: 'remove-bg',
            confidence: 0.75
        });
    }

    if (file.type.startsWith('video/')) {
        suggestions.push({
            message: "Convert this video to a lightweight GIF?",
            toolId: 'video-to-gif',
            confidence: 0.8
        });
        suggestions.push({
            message: "Extract audio track (MP3)?",
            toolId: 'video-to-mp3',
            confidence: 0.8
        });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
};