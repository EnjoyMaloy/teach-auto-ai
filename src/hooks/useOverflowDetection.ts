import { useState, useEffect, useCallback, RefObject } from 'react';

// iPhone 16 dimensions (target screen)
const TARGET_SCREEN_HEIGHT = 852;
// Reserve space for header/progress bar and bottom navigation
const RESERVED_HEADER_HEIGHT = 60;
const RESERVED_FOOTER_HEIGHT = 80;
const AVAILABLE_CONTENT_HEIGHT = TARGET_SCREEN_HEIGHT - RESERVED_HEADER_HEIGHT - RESERVED_FOOTER_HEIGHT;

export interface OverflowState {
  isOverflowing: boolean;
  contentHeight: number;
  availableHeight: number;
  overflowAmount: number;
}

/**
 * Hook to detect if content overflows the available screen space
 * Designed for iPhone 16 (393×852) viewport
 */
export const useOverflowDetection = (
  containerRef: RefObject<HTMLDivElement>,
  dependencies: unknown[] = []
): OverflowState => {
  const [overflowState, setOverflowState] = useState<OverflowState>({
    isOverflowing: false,
    contentHeight: 0,
    availableHeight: AVAILABLE_CONTENT_HEIGHT,
    overflowAmount: 0,
  });

  const checkOverflow = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const contentHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Calculate if content overflows
    const isOverflowing = contentHeight > clientHeight + 5; // 5px tolerance
    const overflowAmount = Math.max(0, contentHeight - clientHeight);

    setOverflowState({
      isOverflowing,
      contentHeight,
      availableHeight: clientHeight,
      overflowAmount,
    });
  }, [containerRef]);

  useEffect(() => {
    checkOverflow();

    // Use ResizeObserver for more reliable detection
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    // Use MutationObserver to detect content changes
    const mutationObserver = new MutationObserver(() => {
      // Small delay to let DOM settle
      requestAnimationFrame(checkOverflow);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [checkOverflow, containerRef, ...dependencies]);

  return overflowState;
};

/**
 * Get estimated height for different sub-block types
 * Used for AI generation constraints
 */
export const getSubBlockEstimatedHeight = (type: string, options?: {
  textSize?: string;
  hasBackdrop?: boolean;
  imageSize?: string;
  tableRows?: number;
}): number => {
  const BASE_HEIGHTS: Record<string, number> = {
    heading: 60,
    text: 80,
    badge: 40,
    icon: 70,
    button: 50,
    divider: 30,
    image: 180,
    table: 150,
    animation: 150,
  };

  let height = BASE_HEIGHTS[type] || 60;

  // Adjust for text size
  if (options?.textSize === 'xlarge') height *= 1.3;
  if (options?.textSize === 'large') height *= 1.15;
  if (options?.textSize === 'small') height *= 0.85;

  // Adjust for backdrop padding
  if (options?.hasBackdrop) height += 24;

  // Adjust for image size
  if (type === 'image') {
    if (options?.imageSize === 'full') height = 300;
    if (options?.imageSize === 'large') height = 220;
    if (options?.imageSize === 'small') height = 120;
  }

  // Adjust for table rows
  if (type === 'table' && options?.tableRows) {
    height = 40 + (options.tableRows * 35);
  }

  return height;
};

/**
 * Calculate maximum sub-blocks that can fit
 */
export const calculateMaxSubBlocks = (
  currentBlocks: Array<{ type: string; textSize?: string; backdrop?: string; imageSize?: string; tableData?: unknown[][] }>,
  availableHeight: number = AVAILABLE_CONTENT_HEIGHT
): { canFit: number; totalHeight: number; remaining: number } => {
  let totalHeight = 0;
  let canFit = 0;

  for (const block of currentBlocks) {
    const height = getSubBlockEstimatedHeight(block.type, {
      textSize: block.textSize,
      hasBackdrop: !!block.backdrop && block.backdrop !== 'none',
      imageSize: block.imageSize,
      tableRows: block.tableData?.length,
    });
    
    if (totalHeight + height <= availableHeight) {
      totalHeight += height;
      canFit++;
    } else {
      break;
    }
  }

  return {
    canFit,
    totalHeight,
    remaining: availableHeight - totalHeight,
  };
};

// Export constants for AI prompts
export const DESIGN_BLOCK_CONSTRAINTS = {
  targetScreenHeight: TARGET_SCREEN_HEIGHT,
  availableContentHeight: AVAILABLE_CONTENT_HEIGHT,
  maxSubBlocks: 6, // Conservative limit
  maxTextLength: 150, // Characters per text block
  maxHeadingLength: 45,
};