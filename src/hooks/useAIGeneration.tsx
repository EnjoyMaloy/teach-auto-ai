import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Lesson } from '@/types/course';
import { CourseDesignSystem } from '@/types/course';

export type AIGenerationStatus = 'idle' | 'generating' | 'completed' | 'cancelled' | 'error';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
}

interface AIGenerationState {
  status: AIGenerationStatus;
  steps: GenerationStep[];
  prompt: string;
  error: string | null;
  startTime: number | null;
  endTime: number | null;
  generatedLessons: Lesson[] | null;
  skipImages: boolean;
}

interface AIGenerationContextType {
  state: AIGenerationState;
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  startGeneration: (prompt: string, skipImages: boolean) => void;
  cancelGeneration: () => void;
  resetGeneration: () => void;
  updateStep: (stepId: string, updates: Partial<GenerationStep>) => void;
  setSteps: (steps: GenerationStep[]) => void;
  setStatus: (status: AIGenerationStatus) => void;
  setError: (error: string | null) => void;
  setGeneratedLessons: (lessons: Lesson[] | null) => void;
  completeGeneration: (lessons: Lesson[]) => void;
  abortController: React.MutableRefObject<AbortController | null>;
  designSystem?: CourseDesignSystem;
  setDesignSystem: (ds: CourseDesignSystem | undefined) => void;
  showCompletionFlash: boolean;
  setShowCompletionFlash: (show: boolean) => void;
}

const AIGenerationContext = createContext<AIGenerationContextType | null>(null);

const initialState: AIGenerationState = {
  status: 'idle',
  steps: [],
  prompt: '',
  error: null,
  startTime: null,
  endTime: null,
  generatedLessons: null,
  skipImages: false,
};

export const AIGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AIGenerationState>(initialState);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [designSystem, setDesignSystem] = useState<CourseDesignSystem | undefined>();
  const [showCompletionFlash, setShowCompletionFlash] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const startGeneration = useCallback((prompt: string, skipImages: boolean) => {
    abortController.current = new AbortController();
    setState({
      status: 'generating',
      steps: [],
      prompt,
      error: null,
      startTime: Date.now(),
      endTime: null,
      generatedLessons: null,
      skipImages,
    });
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setState(prev => ({
      ...prev,
      status: 'cancelled',
      endTime: Date.now(),
    }));
  }, []);

  const resetGeneration = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setState(initialState);
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<GenerationStep>) => {
    setState(prev => {
      const stepIndex = prev.steps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) return prev;

      const newSteps = prev.steps.map((step, idx) => {
        if (idx < stepIndex) {
          // All previous steps should be completed
          if (step.status !== 'completed' && step.status !== 'error') {
            return { ...step, status: 'completed' as const };
          }
          return step;
        }
        if (idx === stepIndex) {
          return { ...step, ...updates };
        }
        // Steps after current one: if current is becoming active, ensure later steps stay pending
        if (updates.status === 'active' && step.status === 'active') {
          return { ...step, status: 'pending' as const };
        }
        return step;
      });

      return { ...prev, steps: newSteps };
    });
  }, []);

  const setSteps = useCallback((steps: GenerationStep[]) => {
    setState(prev => ({ ...prev, steps }));
  }, []);

  const setStatus = useCallback((status: AIGenerationStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ 
      ...prev, 
      error,
      status: error ? 'error' : prev.status,
      endTime: error ? Date.now() : prev.endTime,
    }));
  }, []);

  const setGeneratedLessons = useCallback((lessons: Lesson[] | null) => {
    setState(prev => ({ ...prev, generatedLessons: lessons }));
  }, []);

  const completeGeneration = useCallback((lessons: Lesson[]) => {
    setState(prev => ({
      ...prev,
      status: 'completed',
      generatedLessons: lessons,
      endTime: Date.now(),
    }));
    
    // Show completion flash on the button
    setShowCompletionFlash(true);
    
    // Play completion sound
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
    
    // Auto-hide flash after animation
    setTimeout(() => setShowCompletionFlash(false), 2000);
  }, []);

  return (
    <AIGenerationContext.Provider
      value={{
        state,
        isDialogOpen,
        setDialogOpen,
        startGeneration,
        cancelGeneration,
        resetGeneration,
        updateStep,
        setSteps,
        setStatus,
        setError,
        setGeneratedLessons,
        completeGeneration,
        abortController,
        designSystem,
        setDesignSystem,
        showCompletionFlash,
        setShowCompletionFlash,
      }}
    >
      {children}
    </AIGenerationContext.Provider>
  );
};

export const useAIGeneration = () => {
  const context = useContext(AIGenerationContext);
  if (!context) {
    throw new Error('useAIGeneration must be used within AIGenerationProvider');
  }
  return context;
};

// Helper to get generation duration in seconds
export const getGenerationDuration = (startTime: number | null, endTime: number | null): number => {
  if (!startTime) return 0;
  const end = endTime || Date.now();
  return Math.round((end - startTime) / 1000);
};
