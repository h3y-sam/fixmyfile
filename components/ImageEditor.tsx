import React, { useEffect, useRef, useState } from 'react';
import { ToolOptionsProps } from '../types';

interface ImageEditorProps extends ToolOptionsProps {
    mode?: 'edit';
}

type Tab = 'transform' | 'adjust' | 'filters' | 'draw' | 'insert' | 'ai';
type AiMode = 'none' | 'remove-object';

const ImageEditor: React.FC<ImageEditorProps> = ({ files, options, setOptions }) => {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [canvas, setCanvas] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<Tab>('adjust');
    const [activeObject, setActiveObject] = useState<any>(null);
    const [zoom, setZoom] = useState(1);
    const [color, setColor] = useState('#4F46E5');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [aiMode, setAiMode] = useState<AiMode>('none');
    
    // Filter States
    const [filters, setFilters] = useState({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,
        noise: 0,
        pixelate: 0
    });

    const [eraserMode, setEraserMode] = useState(false);

    // Initialize Canvas
    useEffect(() => {
        if (!files || files.length === 0 || !canvasContainerRef.current) return;

        // Reset state
        setFilters({ brightness: 0, contrast: 0, saturation: 0, blur: 0, noise: 0, pixelate: 0 });
        setHistory([]);
        setHistoryIndex(-1);
        setEraserMode(false);
        setAiMode('none');

        const canvasEl = document.createElement('canvas');
        canvasContainerRef.current.innerHTML = '';
        canvasContainerRef.current.appendChild(canvasEl);

        const fabricCanvas = new window.fabric.Canvas(canvasEl, {
            preserveObjectStacking: true,
            selection: true
        });

        setCanvas(fabricCanvas);

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                window.fabric.Image.fromURL(e.target.result as string, (img: any) => {
                    // Max constraints
                    const maxW = 800;
                    const maxH = 600;
                    let scale = 1;
                    if (img.width > maxW || img.height > maxH) {
                        scale = Math.min(maxW / img.width, maxH / img.height);
                    }
                    img.scale(scale);
                    
                    fabricCanvas.setWidth(img.width * scale);
                    fabricCanvas.setHeight(img.height * scale);
                    fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
                    
                    // Initial History
                    const json = JSON.stringify(fabricCanvas.toJSON(['filters']));
                    setHistory([json]);
                    setHistoryIndex(0);
                    updateOutput(fabricCanvas);
                });
            }
        };
        reader.readAsDataURL(files[0]);

        // Event Listeners
        fabricCanvas.on('selection:created', (e: any) => setActiveObject(e.selected[0]));
        fabricCanvas.on('selection:updated', (e: any) => setActiveObject(e.selected[0]));
        fabricCanvas.on('selection:cleared', () => setActiveObject(null));
        
        fabricCanvas.on('mouse:down', (e: any) => {
             // Access eraser property directly from canvas instance
             if (fabricCanvas.isEraserMode && e.target) {
                 fabricCanvas.remove(e.target);
                 fabricCanvas.requestRenderAll();
                 // object:removed event will trigger history save
             }
        });

        return () => { fabricCanvas.dispose(); };
    }, [files]);

    // Re-bind history events when canvas exists
    useEffect(() => {
        if (!canvas) return;

        const handleSave = () => {
             if (canvas._isRestoring) return;
             const json = JSON.stringify(canvas.toJSON(['filters']));
             setHistory(prev => {
                 const newHist = prev.slice(0, historyIndex + 1);
                 newHist.push(json);
                 return newHist;
             });
             setHistoryIndex(prev => prev + 1);
             updateOutput(canvas);
        };

        canvas.off('object:modified');
        canvas.off('object:added');
        canvas.off('object:removed'); // Clean up
        
        canvas.on('object:modified', handleSave);
        canvas.on('object:added', handleSave);
        canvas.on('object:removed', handleSave); // Important for Undo/Eraser

        return () => {
             canvas.off('object:modified', handleSave);
             canvas.off('object:added', handleSave);
             canvas.off('object:removed', handleSave);
        };
    }, [canvas, historyIndex]); 

    // Sync Eraser/Draw Mode
    useEffect(() => {
        if(canvas) {
            canvas.isEraserMode = eraserMode;
            // Use 'cell' cursor for eraser (looks like a tool) instead of 'not-allowed'
            canvas.defaultCursor = eraserMode ? 'cell' : 'default';
            canvas.hoverCursor = eraserMode ? 'cell' : 'move';
            
            if (aiMode === 'remove-object') {
                canvas.isDrawingMode = true;
                canvas.selection = false;
                canvas.skipTargetFind = true;
                if(canvas.freeDrawingBrush) {
                     canvas.freeDrawingBrush.color = 'rgba(255, 50, 50, 0.5)';
                     canvas.freeDrawingBrush.width = 20;
                     canvas.freeDrawingBrush.strokeLineCap = 'round';
                }
            } else if (eraserMode) {
                canvas.isDrawingMode = false;
                canvas.selection = false;
                canvas.skipTargetFind = false;
                // Important: Make objects 'evented' so they receive mouse events, but not 'selectable'
                canvas.forEachObject((o: any) => {
                    o.set('selectable', false);
                    o.set('evented', true); 
                });
            } else {
                 if (activeTab === 'draw') {
                     canvas.isDrawingMode = true;
                     canvas.skipTargetFind = true;
                     if(canvas.freeDrawingBrush) {
                        canvas.freeDrawingBrush.color = color;
                        canvas.freeDrawingBrush.width = 5;
                     }
                 } else {
                     canvas.isDrawingMode = false;
                     canvas.skipTargetFind = false;
                     canvas.selection = true;
                     canvas.forEachObject((o: any) => {
                         o.set('selectable', true);
                         o.set('evented', true);
                     });
                 }
            }
            canvas.requestRenderAll();
        }
    }, [eraserMode, activeTab, canvas, aiMode, color]);

    const undo = () => {
        if (historyIndex > 0 && canvas) {
            canvas._isRestoring = true;
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            
            canvas.loadFromJSON(history[prevIndex], () => {
                canvas.renderAll();
                canvas._isRestoring = false;
                updateOutput(canvas);
                
                // Re-apply current mode settings after loading from JSON
                if (canvas.isEraserMode) {
                    canvas.forEachObject((o: any) => {
                        o.set('selectable', false);
                        o.set('evented', true);
                    });
                }
            });
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1 && canvas) {
            canvas._isRestoring = true;
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            
            canvas.loadFromJSON(history[nextIndex], () => {
                canvas.renderAll();
                canvas._isRestoring = false;
                updateOutput(canvas);
                
                 if (canvas.isEraserMode) {
                    canvas.forEachObject((o: any) => {
                        o.set('selectable', false);
                        o.set('evented', true);
                    });
                }
            });
        }
    };

    const updateOutput = (c: any) => {
        // Debounce or just do it
        const dataUrl = c.toDataURL({ format: 'png', quality: 1, multiplier: 1/zoom });
        setOptions({ ...options, imageDataUrl: dataUrl });
    };

    // --- Tools ---

    const applyFilter = (type: string, value: number) => {
        if (!canvas || !canvas.backgroundImage) return;
        const img = canvas.backgroundImage;

        const updateFilter = (filterClass: any, config: any) => {
            img.filters = img.filters.filter((f: any) => !(f instanceof filterClass));
            if (value !== 0) {
                img.filters.push(new filterClass(config));
            }
        };

        if (type === 'brightness') updateFilter(window.fabric.Image.filters.Brightness, { brightness: value });
        if (type === 'contrast') updateFilter(window.fabric.Image.filters.Contrast, { contrast: value });
        if (type === 'saturation') updateFilter(window.fabric.Image.filters.Saturation, { saturation: value });
        if (type === 'blur') updateFilter(window.fabric.Image.filters.Blur, { blur: value });
        if (type === 'noise') updateFilter(window.fabric.Image.filters.Noise, { noise: value * 100 });
        if (type === 'pixelate') updateFilter(window.fabric.Image.filters.Pixelate, { blocksize: value * 10 + 2 });

        img.applyFilters();
        canvas.renderAll();
        canvas.fire('object:modified'); // Trigger history
        updateOutput(canvas);
    };

    const handleFilterChange = (type: keyof typeof filters, val: number) => {
        setFilters(prev => ({ ...prev, [type]: val }));
        applyFilter(type, val);
    };

    const addText = () => {
        const text = new window.fabric.IText('Double click to edit', {
            left: canvas.width / 2 - 50,
            top: canvas.height / 2,
            fontFamily: 'Plus Jakarta Sans',
            fill: color,
            fontSize: 24
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        setEraserMode(false);
    };

    const addRect = () => {
        const rect = new window.fabric.Rect({
            left: canvas.width / 2 - 50,
            top: canvas.height / 2 - 50,
            fill: color,
            width: 100,
            height: 100
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        setEraserMode(false);
    };

    const addCircle = () => {
        const circle = new window.fabric.Circle({
            left: canvas.width / 2 - 25,
            top: canvas.height / 2 - 25,
            fill: color,
            radius: 50
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        setEraserMode(false);
    };

    const crop = (ratio?: number) => {
        if (!canvas) return;
        setEraserMode(false);
        const rect = new window.fabric.Rect({
            fill: 'rgba(0,0,0,0.3)',
            stroke: '#fff',
            strokeDashArray: [5, 5],
            strokeWidth: 2,
            left: canvas.width * 0.1, 
            top: canvas.height * 0.1,
            width: canvas.width * 0.8,
            height: ratio ? (canvas.width * 0.8) / ratio : canvas.height * 0.8,
            cornerColor: 'white',
            transparentCorners: false,
            lockRotation: true,
            id: 'crop-rect' 
        });
        
        canvas.add(rect);
        canvas.setActiveObject(rect);
    };

    const applyCrop = () => {
        const cropObj = canvas.getObjects().find((o: any) => o.id === 'crop-rect');
        if (!cropObj || !canvas.backgroundImage) return;

        const bg = canvas.backgroundImage;
        
        const dataUrl = canvas.toDataURL({
            left: cropObj.left,
            top: cropObj.top,
            width: cropObj.getScaledWidth(),
            height: cropObj.getScaledHeight(),
            format: 'png',
            multiplier: 1 / bg.scaleX 
        });

        window.fabric.Image.fromURL(dataUrl, (img: any) => {
             canvas.remove(cropObj);
             canvas.setWidth(cropObj.getScaledWidth());
             canvas.setHeight(cropObj.getScaledHeight());
             canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
             canvas.fire('object:modified');
        });
    };

    const applyObjectRemoval = () => {
        if (!canvas) return;
        
        // 1. Identify mask paths (red brush strokes)
        const allObjects = canvas.getObjects();
        const maskPaths = allObjects.filter((o: any) => o.stroke === 'rgba(255, 50, 50, 0.5)');
        
        if (maskPaths.length === 0) return;

        // 2. Calculate bounding box of mask
        const group = new window.fabric.Group(maskPaths);
        const { left, top, width, height } = group.getBoundingRect();
        group.destroy(); // Ungroup, don't keep it

        // 3. Remove mask paths
        maskPaths.forEach((p: any) => canvas.remove(p));

        // 4. Mock Inpainting / Patching Logic
        // We will "clone" a patch from the left/right of the object to cover it
        // This simulates a content-aware fill for simple backgrounds
        
        const patchOffset = width; // Shift by one width to the left
        const sourceLeft = Math.max(0, left - patchOffset);
        
        // Capture patch from the source area
        // Note: multiplier 1 assumes canvas is 1:1 with display, may need adjustment if zoomed
        const patchDataUrl = canvas.toDataURL({
            left: sourceLeft,
            top: top,
            width: width,
            height: height,
            format: 'png'
        });

        window.fabric.Image.fromURL(patchDataUrl, (patch: any) => {
            patch.set({
                left: left,
                top: top,
                selectable: false,
                evented: false
            });
            
            // Add a slight blur to blend seams (Mock "AI" blending)
            patch.filters.push(new window.fabric.Image.filters.Blur({ blur: 0.1 }));
            patch.applyFilters();
            
            canvas.add(patch);
            canvas.renderAll();
            canvas.fire('object:modified'); // Save history
        });

        setAiMode('none');
    };

    const changeLayerOrder = (direction: 'up' | 'down') => {
        if (!activeObject) return;
        if (direction === 'up') activeObject.bringForward();
        else activeObject.sendBackwards();
        canvas.renderAll();
        canvas.fire('object:modified');
    };

    const deleteObject = () => {
        if (activeObject) {
            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.renderAll();
            // Object removed fires via event listener
        }
    };

    const setDrawingMode = (enable: boolean) => {
        if (!canvas) return;
        setEraserMode(false);
        canvas.isDrawingMode = enable;
        if (enable) {
            canvas.freeDrawingBrush = new window.fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = color;
            canvas.freeDrawingBrush.width = 5;
        }
    };

    const handleZoom = (val: number) => {
        setZoom(val);
        canvas.setZoom(val);
    };

    return (
        <div className="flex h-[80vh] w-full bg-gray-100 dark:bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
            {/* Left Sidebar: Tools */}
            <div className="w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-4 z-10">
                <ToolButton icon="fa-crop-alt" label="Transform" active={activeTab === 'transform'} onClick={() => { setActiveTab('transform'); setEraserMode(false); setAiMode('none'); }} />
                <ToolButton icon="fa-sliders-h" label="Adjust" active={activeTab === 'adjust'} onClick={() => { setActiveTab('adjust'); setEraserMode(false); setAiMode('none'); }} />
                <ToolButton icon="fa-magic" label="Filters" active={activeTab === 'filters'} onClick={() => { setActiveTab('filters'); setEraserMode(false); setAiMode('none'); }} />
                <ToolButton icon="fa-shapes" label="Insert" active={activeTab === 'insert'} onClick={() => { setActiveTab('insert'); setEraserMode(false); setAiMode('none'); }} />
                <ToolButton icon="fa-paint-brush" label="Draw" active={activeTab === 'draw'} onClick={() => { setActiveTab('draw'); setDrawingMode(true); setAiMode('none'); }} />
                <ToolButton icon="fa-robot" label="AI Tools" active={activeTab === 'ai'} onClick={() => { setActiveTab('ai'); setEraserMode(false); }} />
            </div>

            {/* Sub-Sidebar: Properties */}
            <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-200 capitalize">
                    {activeTab === 'ai' && aiMode !== 'none' ? 'Object Eraser' : activeTab}
                </div>
                
                <div className="p-4 space-y-6">
                    {activeTab === 'transform' && (
                        <div className="space-y-4">
                            <button onClick={() => crop()} className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">Free Crop</button>
                            <button onClick={() => crop(1)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">Square (1:1)</button>
                            <button onClick={() => crop(16/9)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">16:9</button>
                            {canvas?.getObjects().find((o: any) => o.id === 'crop-rect') && (
                                <button onClick={applyCrop} className="w-full py-2 bg-brand-primary text-white rounded-lg text-sm font-bold shadow-md">Apply Crop</button>
                            )}
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                             <button onClick={() => { if(canvas.backgroundImage) canvas.backgroundImage.rotate(canvas.backgroundImage.angle + 90); canvas.renderAll(); }} className="w-full py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">Rotate 90°</button>
                             <button onClick={() => { if(canvas.backgroundImage) canvas.backgroundImage.set('flipX', !canvas.backgroundImage.flipX); canvas.renderAll(); }} className="w-full py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">Flip Horizontally</button>
                        </div>
                    )}

                    {activeTab === 'adjust' && (
                        <div className="space-y-6">
                            <SliderControl label="Brightness" value={filters.brightness} min={-1} max={1} step={0.05} onChange={(v) => handleFilterChange('brightness', v)} />
                            <SliderControl label="Contrast" value={filters.contrast} min={-1} max={1} step={0.05} onChange={(v) => handleFilterChange('contrast', v)} />
                            <SliderControl label="Saturation" value={filters.saturation} min={-1} max={1} step={0.05} onChange={(v) => handleFilterChange('saturation', v)} />
                            <SliderControl label="Blur" value={filters.blur} min={0} max={1} step={0.05} onChange={(v) => handleFilterChange('blur', v)} />
                        </div>
                    )}

                    {activeTab === 'filters' && (
                        <div className="grid grid-cols-2 gap-3">
                             {['Sepia', 'Grayscale', 'Invert', 'Vintage', 'Kodachrome', 'Technicolor', 'Polaroid'].map(f => (
                                 <button key={f} onClick={() => { /* Apply preset logic */ }} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs font-medium hover:bg-brand-primary hover:text-white transition-colors">
                                     {f}
                                 </button>
                             ))}
                             <div className="col-span-2">
                                <SliderControl label="Noise" value={filters.noise} min={0} max={1} step={0.1} onChange={(v) => handleFilterChange('noise', v)} />
                                <SliderControl label="Pixelate" value={filters.pixelate} min={0} max={1} step={0.1} onChange={(v) => handleFilterChange('pixelate', v)} />
                             </div>
                        </div>
                    )}

                    {activeTab === 'insert' && (
                        <div className="space-y-4">
                            <button onClick={addText} className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center gap-2"><i className="fas fa-font"></i> Add Text</button>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={addRect} className="py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-lg"><i className="far fa-square"></i></button>
                                <button onClick={addCircle} className="py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-lg"><i className="far fa-circle"></i></button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">Fill Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#000000', '#FFFFFF'].map(c => (
                                        <button key={c} onClick={() => { setColor(c); if(activeObject) { activeObject.set('fill', c); canvas.renderAll(); canvas.fire('object:modified'); } }} style={{backgroundColor: c}} className={`w-8 h-8 rounded-full border border-gray-200 shadow-sm ${color === c ? 'ring-2 ring-offset-2 ring-brand-primary' : ''}`}></button>
                                    ))}
                                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 opacity-0 absolute" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'draw' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">Free drawing mode.</p>
                            
                            <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={() => { setEraserMode(false); setDrawingMode(true); }}
                                    className={`flex-1 py-2 text-sm rounded-lg border ${!eraserMode ? 'bg-brand-primary text-white border-brand-primary' : 'bg-gray-100 border-gray-200 text-gray-600'}`}
                                >
                                    <i className="fas fa-pen mr-2"></i> Pen
                                </button>
                                <button 
                                    onClick={() => setEraserMode(true)}
                                    className={`flex-1 py-2 text-sm rounded-lg border ${eraserMode ? 'bg-red-500 text-white border-red-500' : 'bg-gray-100 border-gray-200 text-gray-600'}`}
                                >
                                    <i className="fas fa-eraser mr-2"></i> Eraser
                                </button>
                            </div>

                            {!eraserMode && (
                                <>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">Brush Color</label>
                                <input type="color" value={color} onChange={(e) => { setColor(e.target.value); if(canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = e.target.value; }} className="w-full h-10 rounded-lg cursor-pointer" />
                                </>
                            )}
                            
                            <div className="h-px bg-gray-200 my-2"></div>
                             <div className="flex gap-2">
                                <button onClick={undo} disabled={historyIndex <= 0} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 disabled:opacity-50"><i className="fas fa-undo mr-1"></i> Undo</button>
                                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 disabled:opacity-50"><i className="fas fa-redo mr-1"></i> Redo</button>
                             </div>

                            <button onClick={() => { setDrawingMode(false); setActiveTab('insert'); }} className="w-full py-2 border border-gray-300 rounded-lg text-sm mt-4">Exit Draw Mode</button>
                        </div>
                    )}
                    
                    {activeTab === 'ai' && (
                        <div className="space-y-3">
                            {aiMode === 'none' ? (
                                <>
                                <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-bold"><i className="fas fa-magic mr-2"></i> Magic Remove BG</button>
                                <button 
                                    onClick={() => setAiMode('remove-object')}
                                    className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-brand-primary text-brand-primary rounded-lg text-sm font-bold hover:bg-brand-light transition-all"
                                >
                                    <i className="fas fa-eraser mr-2"></i> Magic Eraser
                                </button>
                                <button className="w-full py-3 bg-gray-100 hover:bg-white dark:bg-gray-800 border border-gray-200 rounded-lg text-sm font-medium"><i className="fas fa-expand mr-2"></i> Smart Upscale</button>
                                <button className="w-full py-3 bg-gray-100 hover:bg-white dark:bg-gray-800 border border-gray-200 rounded-lg text-sm font-medium"><i className="fas fa-palette mr-2"></i> Style Transfer</button>
                                </>
                            ) : (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                                        <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                                        Paint over the object you want to remove.
                                    </p>
                                    
                                    <div className="space-y-3">
                                        <button 
                                            onClick={applyObjectRemoval}
                                            className="w-full py-3 bg-brand-primary text-white rounded-lg font-bold shadow-lg hover:shadow-brand-primary/30"
                                        >
                                            <i className="fas fa-check mr-2"></i> Apply Removal
                                        </button>
                                        <button 
                                            onClick={() => { setAiMode('none'); canvas.isDrawingMode = false; canvas.renderAll(); }}
                                            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Layer Controls */}
                {activeObject && aiMode === 'none' && (
                    <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs font-bold text-gray-500 mb-2">Selected Layer</p>
                        <div className="flex gap-2 justify-between">
                            <button onClick={() => changeLayerOrder('up')} title="Bring Forward" className="p-2 bg-white dark:bg-gray-700 rounded shadow-sm hover:text-brand-primary"><i className="fas fa-arrow-up"></i></button>
                            <button onClick={() => changeLayerOrder('down')} title="Send Backward" className="p-2 bg-white dark:bg-gray-700 rounded shadow-sm hover:text-brand-primary"><i className="fas fa-arrow-down"></i></button>
                            <button onClick={deleteObject} title="Delete" className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded shadow-sm hover:bg-red-100"><i className="fas fa-trash"></i></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 bg-gray-50 dark:bg-black/50 overflow-hidden relative flex flex-col">
                <div className="absolute top-4 left-4 z-20 flex bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-1">
                    <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-primary disabled:opacity-30"><i className="fas fa-undo"></i></button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-primary disabled:opacity-30"><i className="fas fa-redo"></i></button>
                    <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button onClick={() => handleZoom(Math.max(0.1, zoom - 0.1))} className="p-2 text-gray-600 dark:text-gray-300"><i className="fas fa-minus"></i></button>
                    <span className="flex items-center px-2 text-xs font-mono text-gray-500">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => handleZoom(zoom + 0.1)} className="p-2 text-gray-600 dark:text-gray-300"><i className="fas fa-plus"></i></button>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-8 cursor-crosshair">
                    <div ref={canvasContainerRef} className="shadow-2xl border border-gray-200 dark:border-gray-800 bg-white"></div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const ToolButton: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 ${active ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
    >
        <i className={`fas ${icon} text-lg mb-1`}></i>
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

const SliderControl: React.FC<{ label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div>
        <div className="flex justify-between mb-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</label>
            <span className="text-xs text-gray-400">{Math.round(value * 100)}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-brand-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

export default ImageEditor;