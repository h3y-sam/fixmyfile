import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-brand-primary p-1.5 rounded-lg">
                  <i className="fas fa-layer-group text-white text-xl"></i>
               </div>
               <span className="text-2xl font-bold tracking-tight">FixMyFile</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Empowering your workflow with secure, client-side file management tools. No server uploads, total privacy.
            </p>
            <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all"><i className="fab fa-twitter"></i></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all"><i className="fab fa-github"></i></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all"><i className="fab fa-discord"></i></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#pdf-tools" className="hover:text-brand-primary transition">PDF Tools</a></li>
              <li><a href="#image-tools" className="hover:text-brand-primary transition">Image Tools</a></li>
              <li><a href="#" className="hover:text-brand-primary transition">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-primary transition">Updates</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-primary transition">Documentation</a></li>
              <li><a href="#" className="hover:text-brand-primary transition">API</a></li>
              <li><a href="#" className="hover:text-brand-primary transition">Community</a></li>
              <li><a href="#" className="hover:text-brand-primary transition">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-primary transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-primary transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-primary transition">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2024 FixMyFile Inc. All Rights Reserved.</p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;