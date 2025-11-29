import { ProcessedFile } from '../types';

// NOTE: Real implementation requires SharedArrayBuffer which needs specific server headers.
// We are mocking the successful processing to demonstrate the UI flow.

export const compressVideo = async (files: File[]): Promise<ProcessedFile> => {
    const file = files[0];
    // Mock processing delay
    await new Promise(r => setTimeout(r, 3000));
    
    return {
        data: file, // Return original for mock
        filename: `compressed_${file.name}`,
        type: file.type
    };
};

export const convertToGif = async (files: File[]): Promise<ProcessedFile> => {
    const file = files[0];
    await new Promise(r => setTimeout(r, 4000));
    
    return {
        data: file, 
        filename: `${file.name.split('.')[0]}.gif`,
        type: 'image/gif'
    };
};

export const extractAudio = async (files: File[]): Promise<ProcessedFile> => {
    const file = files[0];
    await new Promise(r => setTimeout(r, 2000));

    return {
        data: new Blob(['mock audio data'], { type: 'audio/mp3' }),
        filename: `${file.name.split('.')[0]}.mp3`,
        type: 'audio/mp3'
    };
};