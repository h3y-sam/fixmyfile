import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { TOOLS } from './constants';
import { Tool, ProcessingStatus, AiSuggestion } from './types';
import * as AiService from './services/aiService';

// --- Components ---

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400">What would you like to create today?</p>
                </div>
            </div>

            {/* Featured Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* PDF Box */}
                 <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 p-6 rounded-3xl border border-red-200 dark:border-red-900/50">
                    <div className="w-12 h-12 bg-white dark:bg-red-900 rounded-xl flex items-center justify-center text-red-500 mb-4 shadow-sm">
                        <i className="fas fa-file-pdf text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">PDF Tools</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Merge, split, edit and sign documents.</p>
                    <Link to="/tools/pdf" className="text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-2">
                        View all <i className="fas fa-arrow-right"></i>
                    </Link>
                 </div>
                 
                 {/* Image Box */}
                 <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/50">
                    <div className="w-12 h-12 bg-white dark:bg-indigo-900 rounded-xl flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
                        <i className="fas fa-image text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Image Tools</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Crop, resize, filter and convert.</p>
                    <Link to="/tools/image" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                        View all <i className="fas fa-arrow-right"></i>
                    </Link>
                 </div>

                 {/* Video Box */}
                 <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/50">
                    <div className="w-12 h-12 bg-white dark:bg-emerald-900 rounded-xl flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                        <i className="fas fa-video text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Video & Audio</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Compress, extract audio and more.</p>
                    <Link to="/tools/video" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        View all <i className="fas fa-arrow-right"></i>
                    </Link>
                 </div>
            </div>

            {/* Recent Tools Table (Mock) */}
            <div className="bg-white dark:bg-brand-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white">Quick Access</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-gray-50 dark:bg-gray-900">
                    {TOOLS.slice(0, 8).map(tool => (
                        <Link key={tool.id} to={tool.path} className="flex items-center gap-3 p-4 bg-white dark:bg-brand-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${tool.category === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-brand-light text-brand-primary'}`}>
                                <i className={`fas ${tool.icon}`}></i>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tool.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ToolCategoryPage: React.FC<{ category: 'pdf' | 'image' | 'video' }> = ({ category }) => {
    const tools = TOOLS.filter(t => t.category === category || (category === 'video' && t.category === 'audio'));
    
    return (
        <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 capitalize">{category} Tools</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Select a tool to start editing.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map(tool => (
                    <Link key={tool.id} to={tool.path} className="group bg-white dark:bg-brand-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-primary/50 dark:hover:border-brand-primary/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                                tool.category === 'pdf' ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' : 
                                tool.category === 'image' ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                                <i className={`fas ${tool.icon}`}></i>
                            </div>
                            {tool.isAi && (
                                <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wide border border-purple-100">
                                    <i className="fas fa-sparkles mr-1"></i> AI
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">{tool.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const ToolInterface: React.FC = () => {
    const { pathname } = useLocation();
    const currentTool = TOOLS.find(t => t.path === pathname);
    
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
    const [options, setOptions] = useState<any>({});
    const [result, setResult] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset when tool changes
    useEffect(() => {
        setFiles([]);
        setStatus(ProcessingStatus.IDLE);
        setResult(null);
        setSuggestions([]);
        setOptions({});
    }, [pathname]);

    if (!currentTool) return <div>Tool not found</div>;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const newFiles = Array.from(e.target.files);
            setFiles(currentTool.multiple ? [...files, ...newFiles] : [newFiles[0]]);
            
            // AI Analysis
            if (newFiles.length > 0) {
                const suggs = await AiService.analyzeFiles(newFiles);
                setSuggestions(suggs);
            }
        }
    };

    const processFile = async () => {
        setStatus(ProcessingStatus.PROCESSING);
        try {
            const res = await currentTool.action(files, options);
            setResult(res);
            setStatus(ProcessingStatus.COMPLETE);
        } catch (e) {
            console.error(e);
            setStatus(ProcessingStatus.ERROR);
        }
    };

    const downloadResult = () => {
        if (!result) return;
        if (Array.isArray(result)) {
            result.forEach(r => window.saveAs(new Blob([r.data], { type: r.type }), r.filename));
        } else {
            window.saveAs(new Blob([result.data], { type: result.type }), result.filename);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fadeIn pb-20">
            {/* Tool Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to={`/tools/${currentTool.category}`} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <i className="fas fa-arrow-left"></i>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        {currentTool.title}
                        {currentTool.isAi && <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">AI Powered</span>}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">{currentTool.description}</p>
                </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && status === ProcessingStatus.IDLE && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800 rounded-xl flex items-start gap-3">
                    <div className="mt-1 text-purple-600 dark:text-purple-400"><i className="fas fa-robot"></i></div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">AI Suggestion</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{suggestions[0].message}</p>
                        <Link to={TOOLS.find(t => t.id === suggestions[0].toolId)?.path || '#'} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                            Switch to {TOOLS.find(t => t.id === suggestions[0].toolId)?.title}
                        </Link>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-brand-dark rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[500px] flex flex-col">
                {/* Result State */}
                {status === ProcessingStatus.COMPLETE ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center text-3xl mb-6">
                            <i className="fas fa-check"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Download</h2>
                        <p className="text-gray-500 mb-8">Your file has been processed successfully.</p>
                        <div className="flex gap-4">
                            <button onClick={downloadResult} className="px-8 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary shadow-lg shadow-brand-primary/25 transition-all">
                                Download File
                            </button>
                            <button onClick={() => { setStatus(ProcessingStatus.IDLE); setFiles([]); }} className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                                Convert Another
                            </button>
                        </div>
                     </div>
                ) : files.length === 0 ? (
                    /* Upload State */
                    <div 
                        className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-700 m-8 rounded-2xl flex flex-col items-center justify-center hover:border-brand-primary hover:bg-brand-light/20 dark:hover:bg-brand-primary/10 transition-all cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 group-hover:text-brand-primary"></i>
                        </div>
                        <p className="text-xl font-bold text-gray-800 dark:text-white mb-2">Drop files here</p>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">or click to browse</p>
                        <button className="px-6 py-2 bg-brand-primary text-white rounded-lg font-semibold shadow-md">Select Files</button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept={currentTool.accepts} multiple={currentTool.multiple} />
                    </div>
                ) : (
                    /* Editor/Config State */
                    <div className="flex-1 flex flex-col">
                        <div className="border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{files.length} Files Selected</span>
                                {currentTool.multiple && (
                                    <button onClick={() => fileInputRef.current?.click()} className="text-brand-primary text-xs font-bold hover:underline">
                                        + Add More
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setFiles([])} className="text-red-500 text-sm hover:underline">Clear All</button>
                        </div>

                        {/* Specific Editor Component or Generic List */}
                        {currentTool.optionsComponent ? (
                            <div className="flex-1 bg-gray-100 dark:bg-black p-4">
                                <currentTool.optionsComponent files={files} options={options} setOptions={setOptions} />
                            </div>
                        ) : (
                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="space-y-3">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <i className={`fas ${f.type.includes('pdf') ? 'fa-file-pdf text-red-500' : 'fa-file text-gray-400'} text-xl`}></i>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name}</p>
                                                    <p className="text-xs text-gray-500">{(f.size/1024/1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><i className="fas fa-times"></i></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-brand-dark">
                            <button 
                                onClick={processFile}
                                disabled={status === ProcessingStatus.PROCESSING}
                                className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-3"
                            >
                                {status === ProcessingStatus.PROCESSING ? (
                                    <>
                                        <i className="fas fa-circle-notch fa-spin"></i> Processing...
                                    </>
                                ) : (
                                    <>
                                        <span>Start Processing</span>
                                        <i className="fas fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const App: React.FC = () => {
    return (
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tools/pdf" element={<ToolCategoryPage category="pdf" />} />
                    <Route path="/tools/image" element={<ToolCategoryPage category="image" />} />
                    <Route path="/tools/video" element={<ToolCategoryPage category="video" />} />
                    {/* Dynamic Tool Routes */}
                    {TOOLS.map(tool => (
                        <Route key={tool.id} path={tool.path} element={<ToolInterface />} />
                    ))}
                    {/* Fallback */}
                    <Route path="*" element={<div className="p-10 text-center">Page not found</div>} />
                </Routes>
            </Layout>
        </HashRouter>
    );
};

export default App;