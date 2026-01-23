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
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
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

  // Trigger state changes
  useEffect(() => {
    if (!rive) return;

    // Fire the appropriate trigger based on state
    switch (state) {
      case 'correct':
        if (correctInput) {
          // Handle both trigger and boolean inputs
          if (typeof correctInput.fire === 'function') {
            correctInput.fire();
          } else if ('value' in correctInput) {
            correctInput.value = true;
          }
        }
        break;
      case 'incorrect':
        if (incorrectInput) {
          if (typeof incorrectInput.fire === 'function') {
            incorrectInput.fire();
          } else if ('value' in incorrectInput) {
            incorrectInput.value = true;
          }
        }
        break;
      case 'idle':
      default:
        if (idleInput) {
          if (typeof idleInput.fire === 'function') {
            idleInput.fire();
          } else if ('value' in idleInput) {
            idleInput.value = true;
          }
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
