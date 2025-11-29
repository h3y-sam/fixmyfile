import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const location = useLocation();

    const toggleDark = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const navItems = [
        { name: 'Dashboard', icon: 'fa-home', path: '/' },
        { name: 'PDF Tools', icon: 'fa-file-pdf', path: '/tools/pdf' },
        { name: 'Image Tools', icon: 'fa-image', path: '/tools/image' },
        { name: 'Video Tools', icon: 'fa-video', path: '/tools/video' },
        { name: 'History', icon: 'fa-clock', path: '/history' },
        { name: 'Settings', icon: 'fa-cog', path: '/settings' },
    ];

    return (
        <div className="min-h-screen flex bg-brand-surface dark:bg-brand-darker transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 h-screen w-64 bg-white dark:bg-brand-dark border-r border-gray-200 dark:border-gray-800 z-50 transition-transform transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                        <i className="fas fa-layer-group text-xl"></i>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FixMyFile</span>
                </div>

                <nav className="px-4 mt-6 space-y-1">
                    {navItems.map((item) => (
                        <Link 
                            key={item.name} 
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                                ? 'bg-brand-light dark:bg-brand-primary/10 text-brand-primary dark:text-brand-primary' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            <i className={`fas ${item.icon} w-5 text-center`}></i>
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-purple-500"></div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Guest User</p>
                            <p className="text-xs text-gray-500">Free Plan</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-6 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 dark:text-gray-300">
                        <i className="fas fa-bars text-xl"></i>
                    </button>

                    <div className="flex-1 max-w-xl mx-4 lg:mx-0">
                         <div className="relative group">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors"></i>
                            <input 
                                type="text" 
                                placeholder="Search tools (e.g. 'merge', 'crop')..." 
                                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-primary dark:text-white transition-all"
                            />
                         </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleDark} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;