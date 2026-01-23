import React, { useEffect, useCallback } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { cn } from '@/lib/utils';
import { MascotSettings } from '@/types/designSystem';

interface RiveMascotProps {
  settings: MascotSettings;
  state: 'idle' | 'correct' | 'incorrect';
  className?: string;
}

export const RiveMascot: React.FC<RiveMascotProps> = ({
  settings,
  state,
  className,
}) => {
  const {
    riveUrl,
    riveStateMachine = 'State Machine 1',
    riveIdleState = 'idle',
    riveCorrectState = 'correct',
    riveIncorrectState = 'incorrect',
    riveSize = 'medium',
  } = settings;

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-40 h-40',
  };

  const { rive, RiveComponent } = useRive({
    src: riveUrl,
    stateMachines: riveStateMachine,
    autoplay: true,
  });

  // Get state machine inputs
  const idleInput = useStateMachineInput(rive, riveStateMachine, riveIdleState);
  const correctInput = useStateMachineInput(rive, riveStateMachine, riveCorrectState);
  const incorrectInput = useStateMachineInput(rive, riveStateMachine, riveIncorrectState);

  // Debug logging
  useEffect(() => {
    console.log('[RiveMascot] State:', state);
    console.log('[RiveMascot] Rive loaded:', !!rive);
    console.log('[RiveMascot] Inputs:', {
      idle: idleInput ? (typeof idleInput.fire === 'function' ? 'trigger' : 'boolean') : null,
      correct: correctInput ? (typeof correctInput.fire === 'function' ? 'trigger' : 'boolean') : null,
      incorrect: incorrectInput ? (typeof incorrectInput.fire === 'function' ? 'trigger' : 'boolean') : null,
    });
  }, [state, rive, idleInput, correctInput, incorrectInput]);

  // Trigger state changes
  useEffect(() => {
    if (!rive) return;

    console.log('[RiveMascot] Firing state:', state);

    // Fire the appropriate trigger based on state
    switch (state) {
      case 'correct':
        if (correctInput) {
          console.log('[RiveMascot] Firing correct input');
          if (typeof correctInput.fire === 'function') {
            correctInput.fire();
          } else if ('value' in correctInput) {
            correctInput.value = true;
          }
        } else {
          console.warn('[RiveMascot] correctInput not found!');
        }
        break;
      case 'incorrect':
        if (incorrectInput) {
          console.log('[RiveMascot] Firing incorrect input');
          if (typeof incorrectInput.fire === 'function') {
            incorrectInput.fire();
          } else if ('value' in incorrectInput) {
            incorrectInput.value = true;
          }
        } else {
          console.warn('[RiveMascot] incorrectInput not found!');
        }
        break;
      case 'idle':
      default:
        if (idleInput) {
          console.log('[RiveMascot] Firing idle input');
          if (typeof idleInput.fire === 'function') {
            idleInput.fire();
          } else if ('value' in idleInput) {
            idleInput.value = true;
          }
        } else {
          console.warn('[RiveMascot] idleInput not found!');
        }
        break;
    }
  }, [state, rive, idleInput, correctInput, incorrectInput]);

  if (!riveUrl) {
    return null;
  }

  return (
    <div className={cn(sizeClasses[riveSize], 'flex-shrink-0', className)}>
      <RiveComponent />
    </div>
  );
};
