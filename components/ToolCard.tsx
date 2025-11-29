import React from 'react';
import { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  onClick: (tool: Tool) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  const observerRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={observerRef}
      onClick={() => onClick(tool)}
      className={`bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-brand-primary/20 cursor-pointer group flex flex-col items-start h-full
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: '50ms' }}
    >
      <div className={`
        w-14 h-14 rounded-2xl mb-5 flex items-center justify-center text-2xl transition-all duration-300
        ${tool.category === 'pdf' ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-brand-light text-brand-primary group-hover:bg-brand-primary group-hover:text-white'}
      `}>
        <i className={`fas ${tool.icon}`}></i>
      </div>
      
      <div className="flex items-center gap-2 mb-2 w-full">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{tool.title}</h3>
        {tool.isNew && (
          <span className="bg-brand-accent/10 text-brand-accent text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">New</span>
        )}
      </div>
      
      <p className="text-gray-500 text-sm leading-relaxed">{tool.description}</p>
    </div>
  );
};

export default ToolCard;