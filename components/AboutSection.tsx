import React from 'react';

const AboutSection: React.FC = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
      <div className="max-w-4xl mx-auto prose prose-red">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Why use FixMyFile?</h2>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Process Files Locally</h3>
                <p className="text-gray-600">
                    Your files never leave your browser. We use advanced client-side technologies (WebAssembly) to process your documents on your device, ensuring maximum privacy and security.
                </p>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">All Platforms Supported</h3>
                <p className="text-gray-600">
                    FixMyFile works on any device that has access to the internet. Whether you are using Windows, Mac, or Linux, our tools are ready to help.
                </p>
            </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">The Essential File Tools</h3>
        <p className="text-gray-600 mb-4">
            Managing digital documents shouldn't be hard. FixMyFile provides you with a free, comprehensive toolkit to manage PDFs, images, and other formats.
        </p>
        <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Merge PDF:</strong> Combine reports or invoices into a single file.</li>
            <li><strong>Split PDF:</strong> Extract specific pages from a large document.</li>
            <li><strong>Compress:</strong> Reduce file size for email attachments without losing quality.</li>
            <li><strong>Converters:</strong> Transform Word, Excel, and PowerPoint files into PDF and vice versa.</li>
            <li><strong>Image Tools:</strong> Edit, crop, and filter images directly in the browser.</li>
        </ul>
      </div>
    </section>
  );
};

export default AboutSection;