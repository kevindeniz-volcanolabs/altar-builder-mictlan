import { memo } from 'react';
import type { GridPosition, PlacedElement } from '../../types';
import { getAnimationClasses } from '../../utils/animation-engine';

interface GridCellProps {
  position: GridPosition;
  element?: PlacedElement;
  size: { width: number; height: number };
  isHighlighted: boolean;
  highlightType?: 'valid' | 'invalid';
  isDragOver: boolean;
  onDragOver?: (e: React.DragEvent, position: GridPosition) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, position: GridPosition) => void;
  onClick?: (position: GridPosition) => void;
}

/**
 * Individual grid cell component
 * Represents one position in the altar grid
 */
export const GridCell = memo(function GridCell({
  position,
  element,
  size,
  isHighlighted,
  highlightType = 'valid',
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick
}: GridCellProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver?.(e, position);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop?.(e, position);
  };

  const handleClick = () => {
    onClick?.(position);
  };

  // Build class names
  const baseClasses = 'grid-cell relative rounded-lg transition-all duration-200';

  const highlightClasses = isHighlighted
    ? highlightType === 'valid'
      ? 'border-2 border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20'
      : 'border-2 border-red-400 bg-red-400/10 shadow-lg shadow-red-400/20'
    : 'border border-gray-700/50';

  const dragOverClasses = isDragOver
    ? 'scale-105 shadow-xl'
    : '';

  const cursorClasses = element
    ? 'cursor-pointer hover:shadow-md'
    : 'cursor-default';

  const backgroundClasses = element
    ? 'bg-gray-800/40'
    : 'bg-gray-900/30 hover:bg-gray-800/20';

  return (
    <div
      className={`${baseClasses} ${highlightClasses} ${dragOverClasses} ${cursorClasses} ${backgroundClasses}`}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      data-row={position.row}
      data-col={position.col}
      role="gridcell"
      aria-label={`Grid position ${position.row}, ${position.col}${element ? ` with ${element.elementType}` : ' empty'}`}
      tabIndex={0}
    >
      {element && (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <div className={`flex flex-col items-center justify-center gap-1 ${getAnimationClasses(element)} animate-bounce-in`}>
            <span
              className="text-3xl sm:text-4xl md:text-5xl select-none"
              role="img"
              aria-label={element.elementType}
            >
              {/* This will be replaced with actual element icon */}
              {getElementIcon(element.elementType)}
            </span>
            {size.width > 60 && (
              <span className="text-xs text-gray-400 text-center line-clamp-1">
                {element.elementType}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Position indicator for debugging (only show on hover in dev) */}
      {!element && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 left-1 text-[8px] text-gray-600 opacity-0 hover:opacity-100 transition-opacity">
          {position.row},{position.col}
        </div>
      )}

      {/* Highlight indicator */}
      {isHighlighted && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute inset-0 rounded-lg ${
            highlightType === 'valid'
              ? 'bg-green-400/5 animate-pulse'
              : 'bg-red-400/5'
          }`} />
        </div>
      )}
    </div>
  );
});

/**
 * Get emoji icon for element type
 * This is a placeholder - will be replaced with actual icons
 */
function getElementIcon(elementType: string): string {
  const iconMap: Record<string, string> = {
    'vela': '🕯️',
    'flor': '🌼',
    'foto': '🖼️',
    'retrato_principal': '🖼️✨',
    'pan_de_muerto': '🍞',
    'papel_picado': '🎊',
    'calavera': '💀',
    'incienso': '🪔',
    'agua': '💧',
    'sal': '🧂',
    'comida': '🍲',
    'bebida': '🍷',
    'juguete': '🧸',
    'libro': '📖',
    'cruz': '✝️',
    'personales': '🎸'
  };

  return iconMap[elementType] || '❓';
}

GridCell.displayName = 'GridCell';
