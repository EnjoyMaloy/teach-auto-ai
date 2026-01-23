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
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  const { rive, RiveComponent } = useRive({
    src: riveUrl,
    stateMachines: riveStateMachine,
    autoplay: true,
  });

  // Note: The dark background is baked into the .riv file itself.
  // To remove it, edit the file in Rive editor and remove/hide the background layer,
  // or use a different .riv file with transparent background.

  // Get state machine inputs
  const idleInput = useStateMachineInput(rive, riveStateMachine, riveIdleState);
  const correctInput = useStateMachineInput(rive, riveStateMachine, riveCorrectState);
  const incorrectInput = useStateMachineInput(rive, riveStateMachine, riveIncorrectState);

  // Safe fire helper - handles null runtimeInput internally
  const safeFire = (input: ReturnType<typeof useStateMachineInput>) => {
    if (!input) return;
    try {
      if (typeof input.fire === 'function') {
        input.fire();
      } else if ('value' in input) {
        input.value = true;
      }
    } catch (e) {
      // Input not ready yet, ignore
    }
  };

  // Trigger state changes
  useEffect(() => {
    if (!rive) return;

    switch (state) {
      case 'correct':
        safeFire(correctInput);
        break;
      case 'incorrect':
        safeFire(incorrectInput);
        break;
      case 'idle':
      default:
        safeFire(idleInput);
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
