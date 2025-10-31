import type { GridDimensions, GridPosition } from '../types';

/**
 * Get responsive grid dimensions based on viewport width
 */
export function getResponsiveGridDimensions(viewportWidth: number): GridDimensions {
  // Mobile: < 768px -> 6x8 grid
  if (viewportWidth < 768) {
    return { rows: 8, cols: 6 };
  }
  // Tablet: 768px - 1024px -> 9x10 grid
  else if (viewportWidth < 1024) {
    return { rows: 10, cols: 9 };
  }
  // Desktop: >= 1024px -> 12x9 grid (full size)
  else {
    return { rows: 12, cols: 9 };
  }
}

/**
 * Calculate cell size based on grid dimensions and container size
 */
export function calculateCellSize(
  containerWidth: number,
  containerHeight: number,
  gridDimensions: GridDimensions,
  gap: number = 8
): { width: number; height: number } {
  const totalGapWidth = (gridDimensions.cols - 1) * gap;
  const totalGapHeight = (gridDimensions.rows - 1) * gap;

  const cellWidth = (containerWidth - totalGapWidth) / gridDimensions.cols;
  const cellHeight = (containerHeight - totalGapHeight) / gridDimensions.rows;

  // Use the smaller dimension to keep cells square
  const size = Math.min(cellWidth, cellHeight);

  return {
    width: Math.floor(size),
    height: Math.floor(size)
  };
}

/**
 * Convert pixel coordinates to grid position
 */
export function pixelToGridPosition(
  x: number,
  y: number,
  cellSize: { width: number; height: number },
  gap: number = 8,
  gridOffset: { x: number; y: number } = { x: 0, y: 0 }
): GridPosition | null {
  const relativeX = x - gridOffset.x;
  const relativeY = y - gridOffset.y;

  if (relativeX < 0 || relativeY < 0) {
    return null;
  }

  const col = Math.floor(relativeX / (cellSize.width + gap));
  const row = Math.floor(relativeY / (cellSize.height + gap));

  return { row, col };
}

/**
 * Convert grid position to pixel coordinates
 */
export function gridPositionToPixel(
  position: GridPosition,
  cellSize: { width: number; height: number },
  gap: number = 8,
  gridOffset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  const x = gridOffset.x + position.col * (cellSize.width + gap);
  const y = gridOffset.y + position.row * (cellSize.height + gap);

  return { x, y };
}

/**
 * Check if two grid positions are equal
 */
export function arePositionsEqual(pos1: GridPosition, pos2: GridPosition): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Get adjacent grid positions
 */
export function getAdjacentPositions(
  position: GridPosition,
  gridDimensions: GridDimensions,
  includeDiagonals: boolean = false
): GridPosition[] {
  const adjacent: GridPosition[] = [];
  const { row, col } = position;

  // Cardinal directions
  const directions = [
    { row: row - 1, col }, // Up
    { row: row + 1, col }, // Down
    { row, col: col - 1 }, // Left
    { row, col: col + 1 }  // Right
  ];

  // Diagonal directions
  if (includeDiagonals) {
    directions.push(
      { row: row - 1, col: col - 1 }, // Up-Left
      { row: row - 1, col: col + 1 }, // Up-Right
      { row: row + 1, col: col - 1 }, // Down-Left
      { row: row + 1, col: col + 1 }  // Down-Right
    );
  }

  for (const dir of directions) {
    if (
      dir.row >= 0 &&
      dir.row < gridDimensions.rows &&
      dir.col >= 0 &&
      dir.col < gridDimensions.cols
    ) {
      adjacent.push(dir);
    }
  }

  return adjacent;
}

/**
 * Calculate Manhattan distance between two positions
 */
export function getManhattanDistance(pos1: GridPosition, pos2: GridPosition): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Calculate Euclidean distance between two positions
 */
export function getEuclideanDistance(pos1: GridPosition, pos2: GridPosition): number {
  const dx = pos1.col - pos2.col;
  const dy = pos1.row - pos2.row;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get all positions in a rectangular area
 */
export function getPositionsInArea(
  topLeft: GridPosition,
  bottomRight: GridPosition
): GridPosition[] {
  const positions: GridPosition[] = [];

  for (let row = topLeft.row; row <= bottomRight.row; row++) {
    for (let col = topLeft.col; col <= bottomRight.col; col++) {
      positions.push({ row, col });
    }
  }

  return positions;
}

/**
 * Check if position is in the center of the grid
 */
export function isPositionInCenter(
  position: GridPosition,
  gridDimensions: GridDimensions,
  tolerance: number = 1
): boolean {
  const centerRow = Math.floor(gridDimensions.rows / 2);
  const centerCol = Math.floor(gridDimensions.cols / 2);

  return (
    Math.abs(position.row - centerRow) <= tolerance &&
    Math.abs(position.col - centerCol) <= tolerance
  );
}

/**
 * Get positions in a specific row
 */
export function getPositionsInRow(
  row: number,
  gridDimensions: GridDimensions
): GridPosition[] {
  const positions: GridPosition[] = [];

  for (let col = 0; col < gridDimensions.cols; col++) {
    positions.push({ row, col });
  }

  return positions;
}

/**
 * Get positions in a specific column
 */
export function getPositionsInColumn(
  col: number,
  gridDimensions: GridDimensions
): GridPosition[] {
  const positions: GridPosition[] = [];

  for (let row = 0; row < gridDimensions.rows; row++) {
    positions.push({ row, col });
  }

  return positions;
}

/**
 * Find the center position of the grid
 */
export function getCenterPosition(gridDimensions: GridDimensions): GridPosition {
  return {
    row: Math.floor(gridDimensions.rows / 2),
    col: Math.floor(gridDimensions.cols / 2)
  };
}

/**
 * Check if position is on the edge of the grid
 */
export function isPositionOnEdge(
  position: GridPosition,
  gridDimensions: GridDimensions
): boolean {
  return (
    position.row === 0 ||
    position.row === gridDimensions.rows - 1 ||
    position.col === 0 ||
    position.col === gridDimensions.cols - 1
  );
}

/**
 * Get all edge positions
 */
export function getEdgePositions(gridDimensions: GridDimensions): GridPosition[] {
  const positions: GridPosition[] = [];

  // Top and bottom rows
  for (let col = 0; col < gridDimensions.cols; col++) {
    positions.push({ row: 0, col });
    positions.push({ row: gridDimensions.rows - 1, col });
  }

  // Left and right columns (excluding corners already added)
  for (let row = 1; row < gridDimensions.rows - 1; row++) {
    positions.push({ row, col: 0 });
    positions.push({ row, col: gridDimensions.cols - 1 });
  }

  return positions;
}

/**
 * Generate grid position key for Map usage
 */
export function getPositionKey(position: GridPosition): string {
  return `${position.row}-${position.col}`;
}

/**
 * Parse position key back to GridPosition
 */
export function parsePositionKey(key: string): GridPosition | null {
  const parts = key.split('-');
  if (parts.length !== 2) return null;

  const row = parseInt(parts[0], 10);
  const col = parseInt(parts[1], 10);

  if (isNaN(row) || isNaN(col)) return null;

  return { row, col };
}

/**
 * Get random empty position
 */
export function getRandomEmptyPosition(
  gridDimensions: GridDimensions,
  occupiedPositions: GridPosition[]
): GridPosition | null {
  const allPositions: GridPosition[] = [];

  for (let row = 0; row < gridDimensions.rows; row++) {
    for (let col = 0; col < gridDimensions.cols; col++) {
      allPositions.push({ row, col });
    }
  }

  const emptyPositions = allPositions.filter(
    pos => !occupiedPositions.some(occ => arePositionsEqual(pos, occ))
  );

  if (emptyPositions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emptyPositions.length);
  return emptyPositions[randomIndex];
}
