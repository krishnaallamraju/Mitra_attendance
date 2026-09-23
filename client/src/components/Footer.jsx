import React from 'react';

const Footer = () => {
  return (
    <footer class="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span class="font-bold text-slate-300">MITRA Club</span> Attendance Management System &copy; {new Date().getFullYear()}
        </div>
        <div class="flex items-center gap-1.5 text-slate-400">
          <span>Vishnu Institute of Technology</span>
          <span>•</span>
          <span class="text-sky-400 font-medium">Vibe Coding • AI Team • Industry Connect • Marketing</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
