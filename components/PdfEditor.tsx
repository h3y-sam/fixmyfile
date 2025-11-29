import React, { useEffect, useRef, useState } from 'react';
import { ToolOptionsProps } from '../types';

interface PdfEditorProps extends ToolOptionsProps {
    mode?: 'edit' | 'sign';
}

const PdfEditor: React.FC<PdfEditorProps> = ({ files, options, setOptions, mode = 'edit' }) => {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [canvas, setCanvas] = useState<any>(null);
    const [pdf, setPdf] = useState<any>(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'rect' | 'text' | 'highlight' | 'eraser'>(mode === 'sign' ? 'draw' : 'select');
    const [color, setColor] = useState(mode === 'sign' ? '#000000' : '#4F46E5');
    
    // Refs for stale closure prevention in event listeners
    const activeToolRef = useRef(activeTool);
    const colorRef = useRef(color);

    // History State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const historyIndexRef = useRef(historyIndex);
    const historyRef = useRef(history);
    const isHistoryLocked = useRef(false);

    // Store edits per page as DataURLs of the overlay (without background)
    const editsRef = useRef<Record<number, string>>({});

    // Update refs when state changes
    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { colorRef.current = color; }, [color]);
    useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);
    useEffect(() => { historyRef.current = history; }, [history]);

    useEffect(() => {
        if (!files || files.length === 0) return;
        
        const loadPdf = async () => {
            const buffer = await files[0].arrayBuffer();
            const loadingTask = window.pdfjsLib.getDocument(buffer);
            const loadedPdf = await loadingTask.promise;
            setPdf(loadedPdf);
            setNumPages(loadedPdf.numPages);
            setPageNum(1);
        };
        loadPdf();
    }, [files]);

    const saveCurrentPage = () => {
        if (canvas && pdf) {
            // Temporarily hide background for data export
            const bg = canvas.backgroundImage;
            canvas.backgroundImage = null;
            const vpt = canvas.viewportTransform;
            canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
            
            const dataUrl = canvas.toDataURL({ format: 'png' });
            editsRef.current[pageNum - 1] = dataUrl;
            
            // Restore
            canvas.backgroundImage = bg;
            canvas.viewportTransform = vpt;
            
            setOptions({ ...options, edits: editsRef.current });
        }
    };

    const updateHistory = (c: any) => {
        if (isHistoryLocked.current) return;
        const json = JSON.stringify(c.toJSON());
        
        const currentIndex = historyIndexRef.current;
        const currentHistory = historyRef.current;
        
        const newHist = currentHistory.slice(0, currentIndex + 1);
        newHist.push(json);
        
        setHistory(newHist);
        setHistoryIndex(newHist.length - 1);
        saveCurrentPage();
    };

    const undo = () => {
        if (historyIndex > 0 && canvas) {
            isHistoryLocked.current = true;
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            
            canvas.loadFromJSON(history[prevIndex], () => {
                canvas.renderAll();
                isHistoryLocked.current = false;
                saveCurrentPage();
            });
        }
    };

    useEffect(() => {
        if (!pdf || !canvasContainerRef.current) return;

        let fabricCanvas = canvas;
        if (!fabricCanvas) {
            const canvasEl = document.createElement('canvas');
            canvasContainerRef.current.innerHTML = '';
            canvasContainerRef.current.appendChild(canvasEl);
            fabricCanvas = new window.fabric.Canvas(canvasEl, {
                selection: false
            });
            setCanvas(fabricCanvas);
        }

        const renderPage = async () => {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const tempCanvas = document.createElement('canvas');
            const context = tempCanvas.getContext('2d');
            tempCanvas.height = viewport.height;
            tempCanvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport }).promise;
            const bgUrl = tempCanvas.toDataURL();

            fabricCanvas.setWidth(viewport.width);
            fabricCanvas.setHeight(viewport.height);
            
            window.fabric.Image.fromURL(bgUrl, (img: any) => {
                fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
                    scaleX: 1,
                    scaleY: 1,
                    selectable: false,
                    evented: false
                });
                
                // Initialize history
                const json = JSON.stringify(fabricCanvas.toJSON());
                setHistory([json]);
                setHistoryIndex(0);
            });

            fabricCanvas.clear(); 
            // Re-apply brush settings
            updateBrush(fabricCanvas, activeTool, color);
        };

        renderPage();

        // Event listeners (Bound once)
        fabricCanvas.off('object:added');
        fabricCanvas.off('object:modified');
        fabricCanvas.off('object:removed');
        fabricCanvas.off('mouse:down');
        
        // Pass fabricCanvas explicitly to avoid closure issues with 'canvas' state,
        // but use REFS for history state inside the callback.
        fabricCanvas.on('object:added', () => updateHistory(fabricCanvas));
        fabricCanvas.on('object:modified', () => updateHistory(fabricCanvas));
        fabricCanvas.on('object:removed', () => updateHistory(fabricCanvas));

        // Eraser logic using REF to avoid stale closure
        fabricCanvas.on('mouse:down', (e: any) => {
            if (activeToolRef.current === 'eraser' && e.target) {
                fabricCanvas.remove(e.target);
                fabricCanvas.renderAll();
            }
        });

        return () => { }
    }, [pdf, pageNum]);

    const updateBrush = (c: any, tool: string, col: string) => {
        if (!c) return;
        
        if (tool === 'eraser') {
            c.isDrawingMode = false;
            // Use cell cursor instead of not-allowed
            c.defaultCursor = 'cell'; 
            c.hoverCursor = 'cell';
            c.selection = false;
            c.skipTargetFind = false; 
            // Make objects interactable for click events, but not movable
            c.forEachObject((obj: any) => {
                obj.set('selectable', false); 
                obj.set('evented', true);
            });
        } else {
            c.defaultCursor = 'default';
            c.hoverCursor = 'move';
            c.isDrawingMode = tool === 'draw' || tool === 'highlight';
            c.selection = tool === 'select';
            c.skipTargetFind = tool === 'draw' || tool === 'highlight';

            if (c.freeDrawingBrush) {
                c.freeDrawingBrush.color = tool === 'highlight' ? `${col}50` : col; 
                c.freeDrawingBrush.width = tool === 'highlight' ? 20 : 3;
                if (tool === 'highlight') {
                    c.freeDrawingBrush.strokeLineCap = 'square';
                } else {
                    c.freeDrawingBrush.strokeLineCap = 'round';
                }
            }
            // Restore selectability
            if (tool === 'select') {
                c.forEachObject((obj: any) => {
                    obj.set('selectable', true);
                    obj.set('evented', true);
                });
            }
        }
        c.requestRenderAll();
    };

    useEffect(() => {
        updateBrush(canvas, activeTool, color);
    }, [activeTool, color, canvas]);

    const addText = () => {
        if (!canvas) return;
        const text = new window.fabric.IText('Type here', {
            left: 50,
            top: 50,
            fontFamily: 'Plus Jakarta Sans',
            fill: color,
            fontSize: 20
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        setActiveTool('select');
    };

    const addRect = () => {
        if (!canvas) return;
        const rect = new window.fabric.Rect({
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 2,
            width: 100,
            height: 60
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        setActiveTool('select');
    };

    const handlePageChange = (newPage: number) => {
        saveCurrentPage();
        setPageNum(newPage);
        setHistory([]);
        setHistoryIndex(-1);
        if (canvas) canvas.clear();
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm border-b border-gray-100 z-10 overflow-x-auto">
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTool('select')} className={`p-2 rounded-md transition-all ${activeTool === 'select' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`} title="Select">
                            <i className="fas fa-mouse-pointer"></i>
                        </button>
                        <button onClick={() => setActiveTool('draw')} className={`p-2 rounded-md transition-all ${activeTool === 'draw' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`} title="Pen">
                            <i className="fas fa-pen"></i>
                        </button>
                        <button onClick={() => setActiveTool('highlight')} className={`p-2 rounded-md transition-all ${activeTool === 'highlight' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`} title="Highlighter">
                            <i className="fas fa-highlighter"></i>
                        </button>
                        <button onClick={() => setActiveTool('eraser')} className={`p-2 rounded-md transition-all ${activeTool === 'eraser' ? 'bg-red-50 text-red-500 shadow-sm' : 'text-gray-500 hover:text-red-500'}`} title="Eraser (Click to delete)">
                            <i className="fas fa-eraser"></i>
                        </button>
                        
                        {mode === 'edit' && (
                            <>
                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                            <button onClick={addText} className={`p-2 rounded-md transition-all ${activeTool === 'text' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`} title="Add Text">
                                <i className="fas fa-font"></i>
                            </button>
                            <button onClick={addRect} className={`p-2 rounded-md transition-all ${activeTool === 'rect' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`} title="Add Rectangle">
                                <i className="far fa-square"></i>
                            </button>
                            </>
                        )}
                    </div>
                    
                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                    
                    <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer overflow-hidden p-0"
                        title="Color"
                    />
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={undo} 
                        disabled={historyIndex <= 0}
                        className="p-2 text-gray-500 hover:text-brand-primary disabled:opacity-30 transition-colors" 
                        title="Undo"
                    >
                        <i className="fas fa-undo"></i> Undo
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className={`flex-1 overflow-auto bg-gray-50 p-6 flex justify-center items-start`}>
                <div ref={canvasContainerRef} className="shadow-2xl bg-white border border-gray-200"></div>
            </div>

            {/* Pagination */}
            {numPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-3 bg-white border-t border-gray-100">
                    <button 
                        onClick={() => handlePageChange(Math.max(1, pageNum - 1))}
                        disabled={pageNum <= 1}
                        className="px-4 py-1.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-semibold text-gray-700">Page {pageNum} of {numPages}</span>
                    <button 
                        onClick={() => handlePageChange(Math.min(numPages, pageNum + 1))}
                        disabled={pageNum >= numPages}
                        className="px-4 py-1.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default PdfEditor;