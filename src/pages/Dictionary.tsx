import React from 'react';
import { BookOpen } from 'lucide-react';

// Dictionary page - Coming Soon placeholder
const Dictionary: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-white/20" />
      </div>
      <h2 className="text-xl font-semibold text-white/50 mb-2">Словарь</h2>
      <p className="text-white/30 text-sm">Скоро появится</p>
    </div>
  );
};

export default Dictionary;
