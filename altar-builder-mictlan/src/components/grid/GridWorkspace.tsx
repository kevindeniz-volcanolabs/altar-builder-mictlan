import { useEffect, useRef, useState, useCallback } from 'react';
import { GridCell } from './GridCell';
import type {
  GridDimensions,
  GridPosition,
  PlacedElement,
  OfrendarElement,
  ValidationResult
} from '../../types';
import {
  getResponsiveGridDimensions,
  calculateCellSize,
  getPositionKey
} from '../../utils/grid-utils';

interface GridWorkspaceProps {
  dimensions?: GridDimensions;
  elements: PlacedElement[];
  onElementPlace?: (element: OfrendarElement, position: GridPosition) => void;
  onElementRemove?: (elementId: string) => void;
  onCellClick?: (position: GridPosition) => void;
  onDragOver?: (position: GridPosition | null, validation: ValidationResult | null) => void;
  validateDrop?: (element: OfrendarElement, position: GridPosition) => ValidationResult;
  className?: string;
  gap?: number;
}

/**
 * Main grid workspace component
 * Displays the altar building grid with responsive dimensions
 */
export function GridWorkspace({
  dimensions,
  elements,
  onElementPlace,
  onElementRemove,
  onCellClick,
  onDragOver,
  validateDrop,
  className = '',
  gap = 8
}: GridWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridDimensions, setGridDimensions] = useState<GridDimensions>(
    dimensions || getResponsiveGridDimensions(window.innerWidth)
  );
  const [cellSize, setCellSize] = useState({ width: 80, height: 80 });
  const [hoveredPosition, setHoveredPosition] = useState<GridPosition | null>(null);
  const [draggedElement, setDraggedElement] = useState<OfrendarElement | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Update grid dimensions on window resize
  useEffect(() => {
    if (dimensions) {
      setGridDimensions(dimensions);
      return;
    }

    const handleResize = () => {
      const newDimensions = getResponsiveGridDimensions(window.innerWidth);
      setGridDimensions(newDimensions);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dimensions]);

  // Calculate cell size when container size or grid dimensions change
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCellSize = () => {
      if (!containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();
      const newCellSize = calculateCellSize(width, height, gridDimensions, gap);
      setCellSize(newCellSize);
    };

    updateCellSize();

    const resizeObserver = new ResizeObserver(updateCellSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [gridDimensions, gap]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, position: GridPosition) => {
    e.preventDefault();
    setHoveredPosition(position);

    // Get dragged element data
    const elementData = e.dataTransfer.getData('application/json');
    if (!elementData) return;

    try {
      const element: OfrendarElement = JSON.parse(elementData);
      setDraggedElement(element);

      // Validate drop
      if (validateDrop) {
        const result = validateDrop(element, position);
        setValidationResult(result);
        onDragOver?.(position, result);
      }
    } catch (error) {
      console.error('Error parsing dragged element:', error);
    }
  }, [validateDrop, onDragOver]);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setHoveredPosition(null);
    setDraggedElement(null);
    setValidationResult(null);
    onDragOver?.(null, null);
  }, [onDragOver]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, position: GridPosition) => {
    e.preventDefault();

    const elementData = e.dataTransfer.getData('application/json');
    if (!elementData) return;

    try {
      const element: OfrendarElement = JSON.parse(elementData);

      // Validate before placing
      if (validateDrop) {
        const result = validateDrop(element, position);
        if (!result.isValid) {
          console.warn('Invalid drop:', result.reason);
          return;
        }
      }

      onElementPlace?.(element, position);
    } catch (error) {
      console.error('Error dropping element:', error);
    } finally {
      setHoveredPosition(null);
      setDraggedElement(null);
      setValidationResult(null);
      onDragOver?.(null, null);
    }
  }, [validateDrop, onElementPlace, onDragOver]);

  // Handle cell click
  const handleCellClick = useCallback((position: GridPosition) => {
    onCellClick?.(position);
  }, [onCellClick]);

  // Create element position map for quick lookup
  const elementMap = new Map<string, PlacedElement>();
  elements.forEach(element => {
    const key = getPositionKey(element.position);
    elementMap.set(key, element);
  });

  // Generate grid cells
  const gridCells: React.ReactNode[] = [];
  for (let row = 0; row < gridDimensions.rows; row++) {
    for (let col = 0; col < gridDimensions.cols; col++) {
      const position: GridPosition = { row, col };
      const key = getPositionKey(position);
      const element = elementMap.get(key);
      const isHovered = hoveredPosition
        ? hoveredPosition.row === row && hoveredPosition.col === col
        : false;

      const isHighlighted = isHovered && draggedElement !== null;
      const highlightType = validationResult?.isValid ? 'valid' : 'invalid';

      gridCells.push(
        <GridCell
          key={key}
          position={position}
          element={element}
          size={cellSize}
          isHighlighted={isHighlighted}
          highlightType={highlightType}
          isDragOver={isHovered}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleCellClick}
        />
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className={`grid-workspace relative w-full h-full p-4 ${className}`}
      role="grid"
      aria-label="Altar building workspace"
    >
      <div
        className="grid gap-2 justify-center items-start"
        style={{
          gridTemplateColumns: `repeat(${gridDimensions.cols}, ${cellSize.width}px)`,
          gridTemplateRows: `repeat(${gridDimensions.rows}, ${cellSize.height}px)`,
          gap: `${gap}px`
        }}
      >
        {gridCells}
      </div>

      {/* Grid info overlay (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Grid: {gridDimensions.cols}x{gridDimensions.rows} | Cell: {cellSize.width}x{cellSize.height}px | Elements: {elements.length}
        </div>
      )}

      {/* Validation message */}
      {hoveredPosition && draggedElement && validationResult && !validationResult.isValid && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-md text-center animate-fade-in">
          {validationResult.reason}
        </div>
      )}
    </div>
  );
}

GridWorkspace.displayName = 'GridWorkspace';
