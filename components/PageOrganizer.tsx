import React, { useEffect, useState } from 'react';
import { ToolOptionsProps } from '../types';

interface PageItem {
    originalIndex: number;
    rotation: number; // 0, 90, 180, 270
    imageUrl: string;
}

const PageOrganizer: React.FC<ToolOptionsProps> = ({ files, options, setOptions }) => {
    const [pages, setPages] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial load of PDF pages into thumbnails
    useEffect(() => {
        if (!files || files.length === 0) return;

        const loadPages = async () => {
            setLoading(true);
            try {
                const buffer = await files[0].arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument(buffer).promise;
                
                const loadedPages: PageItem[] = [];
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 }); // Thumbnail scale
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport }).promise;
                    loadedPages.push({
                        originalIndex: i - 1,
                        rotation: 0,
                        imageUrl: canvas.toDataURL()
                    });
                }
                setPages(loadedPages);
            } catch (error) {
                console.error("Error loading PDF pages", error);
            } finally {
                setLoading(false);
            }
        };

        loadPages();
    }, [files]);

    // Update parent options whenever local pages state changes
    useEffect(() => {
        const pageOrder = pages.map(p => ({
            index: p.originalIndex,
            rotation: p.rotation
        }));
        setOptions({ ...options, pageOrder });
    }, [pages]);

    const rotatePage = (index: number) => {
        const newPages = [...pages];
        newPages[index].rotation = (newPages[index].rotation + 90) % 360;
        setPages(newPages);
    };

    const deletePage = (index: number) => {
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);
    };

    const movePage = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index > 0) {
            const newPages = [...pages];
            const temp = newPages[index];
            newPages[index] = newPages[index - 1];
            newPages[index - 1] = temp;
            setPages(newPages);
        } else if (direction === 'right' && index < pages.length - 1) {
            const newPages = [...pages];
            const temp = newPages[index];
            newPages[index] = newPages[index + 1];
            newPages[index + 1] = temp;
            setPages(newPages);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-red rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-500">Loading pages...</span>
            </div>
        );
    }

    return (
        <div className="w-full h-[500px] bg-gray-100 rounded-lg p-4 overflow-y-auto">
            {pages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">No pages found</div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pages.map((page, index) => (
                    <div key={`${page.originalIndex}-${index}`} className="relative group bg-white p-2 rounded shadow hover:shadow-md transition-all">
                        <div className="relative aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                             <img 
                                src={page.imageUrl} 
                                alt={`Page ${index + 1}`} 
                                className="object-contain w-full h-full transition-transform duration-300"
                                style={{ transform: `rotate(${page.rotation}deg)` }}
                             />
                             <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 rounded">
                                 {index + 1}
                             </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-1 mt-2">
                             <button 
                                onClick={() => rotatePage(index)} 
                                className="p-1.5 text-gray-600 hover:text-brand-red hover:bg-red-50 rounded"
                                title="Rotate"
                             >
                                 <i className="fas fa-redo"></i>
                             </button>
                             <button 
                                onClick={() => deletePage(index)} 
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                             >
                                 <i className="fas fa-trash"></i>
                             </button>
                             <button 
                                onClick={() => movePage(index, 'left')} 
                                disabled={index === 0}
                                className="p-1.5 text-gray-600 hover:text-brand-red hover:bg-red-50 rounded disabled:opacity-30"
                                title="Move Left"
                             >
                                 <i className="fas fa-chevron-left"></i>
                             </button>
                             <button 
                                onClick={() => movePage(index, 'right')} 
                                disabled={index === pages.length - 1}
                                className="p-1.5 text-gray-600 hover:text-brand-red hover:bg-red-50 rounded disabled:opacity-30"
                                title="Move Right"
                             >
                                 <i className="fas fa-chevron-right"></i>
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PageOrganizer;