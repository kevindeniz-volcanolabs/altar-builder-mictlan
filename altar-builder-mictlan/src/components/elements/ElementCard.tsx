import { memo } from 'react';
import type { OfrendarElement } from '../../types';

interface ElementCardProps {
  element: OfrendarElement;
  usageCount: number;
  isAvailable: boolean;
  onDragStart: (event: React.DragEvent, element: OfrendarElement) => void;
  onDragEnd: (event: React.DragEvent) => void;
}

/**
 * Individual element card for the element panel
 */
export const ElementCard = memo(function ElementCard({
  element,
  usageCount,
  isAvailable,
  onDragStart,
  onDragEnd
}: ElementCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (!isAvailable) {
      e.preventDefault();
      return;
    }
    onDragStart(e, element);
  };

  const progressPercentage = (usageCount / element.maxQuantity) * 100;

  return (
    <div
      className={`element-card relative group ${
        isAvailable
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-not-allowed opacity-50'
      }`}
      draggable={isAvailable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      role="button"
      aria-label={`${element.name} - ${usageCount} of ${element.maxQuantity} used`}
      aria-disabled={!isAvailable}
      tabIndex={isAvailable ? 0 : -1}
    >
      <div
        className={`
          relative rounded-lg p-4 transition-all duration-200
          ${isAvailable
            ? 'bg-gray-800/50 hover:bg-gray-700/50 hover:shadow-lg hover:scale-105 border-2 border-gray-700 hover:border-orange-500/50'
            : 'bg-gray-900/50 border-2 border-gray-800'
          }
        `}
      >
        {/* Element Icon */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl" role="img" aria-label={element.name}>
            {element.icon}
          </span>

          {/* Element Name */}
          <h3 className="text-sm font-medium text-center text-gray-200">
            {element.name}
          </h3>

          {/* Usage Counter */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{usageCount}</span>
              <span>{element.maxQuantity}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercentage >= 100
                    ? 'bg-red-500'
                    : progressPercentage >= 75
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          <p className="font-medium mb-1">{element.name}</p>
          <p className="text-gray-300 text-xs max-w-xs">{element.description}</p>
          {!isAvailable && (
            <p className="text-red-400 mt-1">Maximum quantity reached</p>
          )}
        </div>

        {/* Unavailable overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 rounded-lg">
            <span className="text-2xl">🚫</span>
          </div>
        )}
      </div>
    </div>
  );
});

ElementCard.displayName = 'ElementCard';
