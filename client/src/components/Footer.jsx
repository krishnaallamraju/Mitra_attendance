import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="font-bold text-slate-300">MITRA Club</span> Attendance Management System &copy; {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Vishnu Institute of Technology</span>
          <span>â€¢</span>
          <span className="text-sky-400 font-medium">Vibe Coding â€¢ AI Team â€¢ Industry Connect â€¢ Marketing</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
