import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center bg-white overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-brand-light to-white opacity-60 blur-3xl rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light text-brand-primary text-sm font-semibold mb-6 animate-[fadeIn_0.5s_ease-out]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            New features available
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 mb-8 tracking-tight leading-tight">
          Master your files with <br/>
          <span className="gradient-text">FixMyFile</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          A comprehensive suite of free, client-side tools to merge, split, compress, and convert your documents securely.
        </p>

        {/* Ad Placeholder */}
        <div className="max-w-[728px] h-[90px] mx-auto border border-gray-100 rounded-xl flex items-center justify-center bg-gray-50 text-gray-400 text-sm shadow-sm">
          Advertisement (728x90)
        </div>
      </div>
    </div>
  );
};

export default Hero;