import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Send, ArrowRight, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userName = 'Павел';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a0a0b]">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 100%, hsl(330 90% 50% / 0.4), transparent 50%),
            radial-gradient(ellipse 80% 60% at 30% 90%, hsl(280 80% 50% / 0.3), transparent 45%),
            radial-gradient(ellipse 100% 70% at 70% 95%, hsl(340 85% 55% / 0.35), transparent 50%),
            radial-gradient(ellipse 60% 50% at 50% 60%, hsl(220 90% 50% / 0.25), transparent 40%),
            radial-gradient(ellipse 80% 40% at 20% 40%, hsl(210 95% 45% / 0.2), transparent 35%),
            radial-gradient(ellipse 70% 50% at 80% 30%, hsl(200 90% 50% / 0.15), transparent 40%),
            linear-gradient(180deg, #0a0a0b 0%, #0a0a0b 100%)
          `
        }}
      />
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">

        {/* Welcome Text */}
        <h1 className="text-4xl md:text-5xl font-semibold mb-10 text-white text-center">
          What's on your mind, <span className="text-primary">{userName}</span>?
        </h1>

        {/* Action Card */}
        <div 
          className="w-full max-w-2xl bg-[#1a1a1b] border border-white/10 rounded-2xl p-2 shadow-2xl cursor-pointer hover:border-white/20 transition-all group"
          onClick={() => navigate('/workshop')}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 text-left text-white/50 group-hover:text-white/70 transition-colors">
              Ask Academy to create a course that...
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-white/50" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors">
                Plan
              </button>
              <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <BarChart3 className="w-4 h-4 text-white/50" />
              </button>
              <Button size="sm" className="rounded-full w-9 h-9 p-0 shrink-0 bg-primary hover:bg-primary/90">
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
