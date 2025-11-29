import React, { useState, useRef } from 'react';
import { Tool, ProcessingStatus } from '../types';

interface ToolModalProps {
  tool: Tool;
  onClose: () => void;
}

const ToolModal: React.FC<ToolModalProps> = ({ tool, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<any>({});
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles(tool.multiple ? [...files, ...selected] : [selected[0]]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      // Basic type checking
      const valid = dropped.filter((f: any) => {
         return tool.accepts === '*/*' || tool.accepts.includes(f.type) || tool.accepts.split(',').some(ext => f.name.endsWith(ext));
      });
      
      if(valid.length > 0) {
          setFiles(tool.multiple ? [...files, ...valid] : [valid[0]]);
          setError(null);
      } else {
          setError(`Invalid file type. This tool requires ${tool.accepts}`);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const processTool = async () => {
    if (files.length === 0) return;
    setStatus(ProcessingStatus.PROCESSING);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 800)); // Smooth transition
      const processed = await tool.action(files, options);
      setResult(processed);
      setStatus(ProcessingStatus.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during processing.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const downloadResult = () => {
    if (result) {
        if (Array.isArray(result)) {
            result.forEach(r => window.saveAs(new Blob([r.data], { type: r.type }), r.filename));
        } else {
            window.saveAs(new Blob([result.data], { type: result.type }), result.filename);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-[fadeIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tool.category === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-brand-light text-brand-primary'}`}>
                <i className={`fas ${tool.icon} text-lg`}></i>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">{tool.title}</h2>
                <p className="text-xs text-gray-500 hidden sm:block">Client-side processing • Private & Secure</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50/50">
          
          {/* Main Interaction Area */}
          <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto">
            
            {status === ProcessingStatus.COMPLETE ? (
               <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-6 animate-[fadeIn_0.5s_ease-out]">
                 <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl shadow-sm mb-4">
                   <i className="fas fa-check"></i>
                 </div>
                 <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Success!</h3>
                    <p className="text-gray-500">Your file is ready for download.</p>
                 </div>
                 <button 
                    onClick={downloadResult}
                    className="w-full bg-brand-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-brand-secondary shadow-lg hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
                 >
                    <i className="fas fa-download"></i> Download Now
                 </button>
                 <button onClick={() => { setStatus(ProcessingStatus.IDLE); setFiles([]); setResult(null); }} className="text-gray-500 hover:text-brand-primary font-medium">
                    <i className="fas fa-redo mr-2"></i> Start Over
                 </button>
               </div>
            ) : status === ProcessingStatus.PROCESSING ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-primary rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <p className="text-xl text-gray-800 font-bold mb-2">Processing...</p>
                    <p className="text-gray-500">Hold tight, we're working on it.</p>
                </div>
            ) : (
                <>
                    {/* Upload Area */}
                    {files.length === 0 ? (
                        <div 
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-brand-primary', 'bg-brand-light/50'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('border-brand-primary', 'bg-brand-light/50'); }}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 min-h-[400px] border-3 border-dashed border-gray-200 hover:border-brand-primary/50 hover:bg-white rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all group bg-white"
                        >
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-light transition-all duration-300">
                                <i className="fas fa-cloud-upload-alt text-4xl text-gray-300 group-hover:text-brand-primary"></i>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-2">Drop your files here</p>
                            <p className="text-gray-500 mb-8">or click to browse</p>
                            
                            <div className="bg-brand-primary text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-md group-hover:shadow-brand-primary/30">
                                Select Files
                            </div>
                            
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect} 
                                accept={tool.accepts} 
                                multiple={tool.multiple} 
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full">
                            {/* File List */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800 text-lg">Selected Files ({files.length})</h3>
                                {tool.multiple && (
                                    <button onClick={() => fileInputRef.current?.click()} className="text-brand-primary text-sm font-bold hover:underline bg-brand-light px-3 py-1 rounded-lg">
                                        <i className="fas fa-plus mr-1"></i> Add
                                    </button>
                                )}
                            </div>
                            
                            <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {files.map((file, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/30 transition-colors">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-brand-primary group-hover:bg-brand-light transition-colors">
                                                <i className={`fas ${file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image'} text-xl`}></i>
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate text-sm font-semibold text-gray-700">{file.name}</span>
                                                <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFile(idx)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Options */}
                            {tool.optionsComponent && (
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 flex-1 flex flex-col overflow-y-auto">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Configuration</h4>
                                    <tool.optionsComponent options={options} setOptions={setOptions} files={files} />
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm border border-red-100 flex items-center gap-3">
                                    <i className="fas fa-exclamation-circle text-lg"></i>
                                    {error}
                                </div>
                            )}

                            <div className="mt-auto pt-4">
                                <button 
                                    onClick={processTool}
                                    className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-secondary shadow-lg hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                >
                                    <span>{tool.title === 'Merge PDF' ? 'Merge Files' : 'Start Processing'}</span>
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
          </div>

          {/* Right: Sidebar Ad */}
          <div className="hidden lg:block w-[280px] bg-white border-l border-gray-100 p-6 flex-shrink-0">
             <div className="w-full h-full min-h-[300px] border border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-4">
                Ad Space<br/>(Premium features coming soon)
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ToolModal;