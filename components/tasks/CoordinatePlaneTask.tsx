'use client';

import { TCoordinatePlaneTask } from '@/types/task';
import { useEffect, useState, useRef } from 'react';
import { TaskCard } from './TaskCard';

interface CoordinatePlaneTaskProps {
  task: TCoordinatePlaneTask;
  setAnswer?: (taskId: string, answer: Array<{ x: number; y: number }>) => void;
  initialAnswer?: Array<{ x: number; y: number }>;
  isLocked?: boolean;
}

export function CoordinatePlaneTask({
  task,
  setAnswer,
  initialAnswer = [],
  isLocked = false,
}: CoordinatePlaneTaskProps) {
  const [placedPoints, setPlacedPoints] = useState<Array<{ x: number; y: number }>>(initialAnswer);
  const [submitted, setSubmitted] = useState(isLocked);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag state for tap-and-drag point adjustment
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const justFinishedDragging = useRef(false); // Prevent click event after drag
  const DRAG_THRESHOLD = 5; // pixels of movement before considered a drag
  const DRAG_LIFT_OFFSET = 60; // pixels to lift the point above finger during drag

  // Default grid size or use custom from task
  const gridSize = task.gridSize || { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  const allowMultiplePoints = task.allowMultiplePoints !== false; // Default to true if not specified
  const axisLabelStep = task.axisLabelStep || 1; // Default to 1 (show all integers)
  
  // Calculate adaptive cell size to prevent overflow
  const gridWidth = gridSize.maxX - gridSize.minX;
  const gridHeight = gridSize.maxY - gridSize.minY;
  const visualPaddingCells = 2; // 1 cell padding on each side
  const totalGridCellsX = gridWidth + visualPaddingCells;
  const totalGridCellsY = gridHeight + visualPaddingCells;
  
  // Use container width for responsive sizing, with max limits
  const maxContainerWidth = 600; // Maximum width in pixels
  const maxContainerHeight = 600; // Maximum height in pixels
  const baseCellSize = 30; // Base pixels per unit
  const minCellSize = 12; // Minimum cell size for usability
  
  // Calculate the actual available width for the grid
  // containerWidth is the inner width of the flex container
  // We need to subtract: border (4px total), and some safety margin (4px)
  const gridBorderWidth = 4;
  const safetyMargin = 4;
  const availableWidth = Math.max(containerWidth - gridBorderWidth - safetyMargin, 100);
  
  // Calculate cell size based on available container width
  const responsiveCellSizeX = availableWidth / totalGridCellsX;
  const responsiveCellSizeY = maxContainerHeight / totalGridCellsY;
  
  // Calculate cell size that fits within container (use min of all constraints, but not below minCellSize)
  const calculatedCellSizeX = maxContainerWidth / totalGridCellsX;
  const calculatedCellSizeY = maxContainerHeight / totalGridCellsY;
  const cellSize = Math.max(
    Math.min(calculatedCellSizeX, calculatedCellSizeY, baseCellSize, responsiveCellSizeX, responsiveCellSizeY),
    minCellSize
  );
  
  // Measure container width on mount and resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  useEffect(() => {
    if (isLocked || initialAnswer.length > 0) {
      const correct = checkAnswer(initialAnswer);
      setIsCorrect(correct);
      setSubmitted(true);
      setPlacedPoints(initialAnswer);
    } else {
      setIsCorrect(null);
      setSubmitted(false);
      setPlacedPoints([]);
    }
  }, [task, initialAnswer, isLocked]);

  const checkAnswer = (points: Array<{ x: number; y: number }>) => {
    if (points.length !== task.correctPoints.length) return false;

    // Check if all correct points are placed
    return task.correctPoints.every((correctPoint) =>
      points.some((p) => p.x === correctPoint.x && p.y === correctPoint.y)
    );
  };

  const handlePlaneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (submitted || isLocked) return;
    
    // Skip click if we just finished dragging (prevents double-action on desktop)
    if (justFinishedDragging.current) {
      justFinishedDragging.current = false;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Account for visual padding offset (1 cell on each side)
    const visualPadding = 1;
    const offsetX = visualPadding * cellSize;
    const offsetY = visualPadding * cellSize;

    // Convert click position to grid coordinates
    // Round to nearest grid cell
    const x = Math.round((clickX - offsetX) / cellSize) + gridSize.minX;
    const y = gridSize.maxY - Math.round((clickY - offsetY) / cellSize);

    // Check if point is within bounds
    if (x < gridSize.minX || x > gridSize.maxX || y < gridSize.minY || y > gridSize.maxY) {
      return;
    }

    // Check if point already exists at this location
    const existingIndex = placedPoints.findIndex((p) => p.x === x && p.y === y);
    if (existingIndex !== -1) {
      // Point already exists at this location, do nothing
      return;
    }

    // Check if max points limit reached
    const maxPoints = task.correctPoints.length;
    if (placedPoints.length >= maxPoints) {
      // Max points reached, do nothing
      return;
    }

    // Add new point based on mode
    if (allowMultiplePoints) {
      // Multi-point mode: add to existing points
      setPlacedPoints([...placedPoints, { x, y }]);
    } else {
      // Single-point mode: replace existing point
      setPlacedPoints([{ x, y }]);
    }
  };

  const handleSubmit = () => {
    if (submitted || isLocked) return;

    const correct = checkAnswer(placedPoints);
    setSubmitted(true);
    setIsCorrect(correct);
    setAnswer?.(task.id, placedPoints);
  };

  const handleClear = () => {
    if (submitted || isLocked) return;
    setPlacedPoints([]);
  };

  // Helper to convert pixel position to grid coordinates
  const pixelToGridCoords = (pixelX: number, pixelY: number, rect: DOMRect) => {
    const visualPadding = 1;
    const offsetX = visualPadding * cellSize;
    const offsetY = visualPadding * cellSize;
    
    const relX = pixelX - rect.left;
    const relY = pixelY - rect.top;
    
    const x = Math.round((relX - offsetX) / cellSize) + gridSize.minX;
    const y = gridSize.maxY - Math.round((relY - offsetY) / cellSize);
    
    return { x, y };
  };

  // Start dragging a point
  const handlePointPointerDown = (e: React.PointerEvent, index: number) => {
    if (submitted || isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    
    setDraggingIndex(index);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    
    // Capture pointer for tracking outside the element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer move during drag
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingIndex === null || submitted || isLocked || !dragStartPos) return;
    
    // Check if movement exceeds threshold
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > DRAG_THRESHOLD) {
      setHasMoved(true);
      
      // Update point position in real-time
      const rect = e.currentTarget.getBoundingClientRect();
      const { x, y } = pixelToGridCoords(e.clientX, e.clientY, rect);
      
      // Clamp to grid bounds
      const clampedX = Math.max(gridSize.minX, Math.min(gridSize.maxX, x));
      const clampedY = Math.max(gridSize.minY, Math.min(gridSize.maxY, y));
      
      setPlacedPoints(prev => {
        const newPoints = [...prev];
        newPoints[draggingIndex] = { x: clampedX, y: clampedY };
        return newPoints;
      });
    }
  };

  // End dragging
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingIndex === null) return;
    
    // Release pointer capture
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    
    // Mark that we just finished dragging to prevent click handler from firing
    justFinishedDragging.current = true;
    
    // Point deletion removed - points can only be removed via Clear button
    // If moved, the point is already at its new position
    
    // Reset drag state
    setDraggingIndex(null);
    setDragStartPos(null);
    setHasMoved(false);
  };

  const renderGrid = () => {
    // Add 1 cell padding on each side for visual spacing
    const visualPadding = 1;
    const width = (gridSize.maxX - gridSize.minX + 2 * visualPadding) * cellSize;
    const height = (gridSize.maxY - gridSize.minY + 2 * visualPadding) * cellSize;
    const offsetX = visualPadding * cellSize;
    const offsetY = visualPadding * cellSize;

    return (
      <div className="w-full select-none py-16 overflow-visible">
        <div className="flex justify-center min-w-fit overflow-visible">
          <div
            onClick={handlePlaneClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`relative border-2 border-gray-400 bg-white dark:bg-gray-900 overflow-visible ${
              submitted || isLocked 
                ? 'cursor-not-allowed' 
                : draggingIndex !== null 
                  ? 'cursor-grabbing' 
                  : 'cursor-crosshair'
            }`}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              touchAction: 'none', // Prevent touch scrolling while dragging
            }}
          >
          {/* Grid lines */}
          <svg
            className="absolute inset-0"
            width={width}
            height={height}
            style={{ pointerEvents: 'none' }}
          >
            {/* Vertical grid lines */}
            {Array.from({ length: gridSize.maxX - gridSize.minX + 1 }, (_, i) => {
              const x = i * cellSize + offsetX;
              const isAxis = i === -gridSize.minX;
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={height}
                  stroke={isAxis ? '#000' : '#e5e7eb'}
                  strokeWidth={isAxis ? 2 : 1}
                  className={isAxis ? 'dark:stroke-gray-100' : 'dark:stroke-gray-700'}
                />
              );
            })}

            {/* Horizontal grid lines */}
            {Array.from({ length: gridSize.maxY - gridSize.minY + 1 }, (_, i) => {
              const y = i * cellSize + offsetY;
              const isAxis = i === gridSize.maxY;
              return (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke={isAxis ? '#000' : '#e5e7eb'}
                  strokeWidth={isAxis ? 2 : 1}
                  className={isAxis ? 'dark:stroke-gray-100' : 'dark:stroke-gray-700'}
                />
              );
            })}

            {/* Axis labels */}
            {/* X-axis labels */}
            {Array.from({ length: gridSize.maxX - gridSize.minX + 1 }, (_, i) => {
              const xValue = gridSize.minX + i;
              // Skip 0 and labels not matching the step
              if (xValue === 0 || xValue % axisLabelStep !== 0) return null;
              const x = i * cellSize + offsetX;
              const yAxisPosition = (-gridSize.minY) * cellSize + offsetY;
              return (
                <text
                  key={`x-label-${i}`}
                  x={x}
                  y={yAxisPosition + 16}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  style={{ pointerEvents: 'none' }}
                >
                  {xValue}
                </text>
              );
            })}

            {/* Y-axis labels */}
            {Array.from({ length: gridSize.maxY - gridSize.minY + 1 }, (_, i) => {
              const yValue = gridSize.maxY - i;
              // Skip 0 and labels not matching the step
              if (yValue === 0 || yValue % axisLabelStep !== 0) return null;
              const y = i * cellSize + offsetY;
              const xAxisPosition = (-gridSize.minX) * cellSize + offsetX;
              return (
                <text
                  key={`y-label-${i}`}
                  x={xAxisPosition - 16}
                  y={y + 4}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  style={{ pointerEvents: 'none' }}
                >
                  {yValue}
                </text>
              );
            })}
          </svg>

          {/* Placed points */}
          {placedPoints.map((point, index) => {
            const x = (point.x - gridSize.minX) * cellSize + offsetX;
            const y = (gridSize.maxY - point.y) * cellSize + offsetY;
            const isDragging = draggingIndex === index;
            const canInteract = !submitted && !isLocked;
            
            // Apply visual lift when dragging
            const visualY = isDragging ? y - DRAG_LIFT_OFFSET : y;

            return (
              <div key={index}>
                {/* Target marker at actual position while dragging */}
                {isDragging && (
                  <>
                    {/* Connecting line from lifted point to target */}
                    <svg
                      className="absolute pointer-events-none"
                      style={{
                        left: `${x}px`,
                        top: `${visualY}px`,
                        width: '2px',
                        height: `${DRAG_LIFT_OFFSET}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 9,
                      }}
                    >
                      <line
                        x1="1"
                        y1="0"
                        x2="1"
                        y2={DRAG_LIFT_OFFSET}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>
                    {/* Target marker */}
                    <div
                      className="absolute"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 8,
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="h-4 w-4 rounded-full border-2 border-dashed border-blue-500 bg-blue-100/50 dark:bg-blue-900/30" />
                    </div>
                  </>
                )}
                
                {/* The draggable point (lifted when dragging, drops with animation when released) */}
                <div
                  onPointerDown={(e) => handlePointPointerDown(e, index)}
                  className={`absolute flex flex-col items-center ${
                    canInteract ? 'cursor-grab active:cursor-grabbing' : ''
                  }`}
                  style={{
                    left: `${x}px`,
                    top: `${visualY}px`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: canInteract ? 'auto' : 'none',
                    zIndex: isDragging ? 10 : 1,
                    // Smooth drop animation when releasing, instant movement when dragging
                    transition: isDragging ? 'none' : 'top 0.2s ease-out',
                  }}
                >
                  <div
                    className={`rounded-full border-2 transition-all duration-150 ${
                      isDragging
                        ? 'h-6 w-6 border-blue-400 bg-blue-500 ring-4 ring-blue-200 dark:ring-blue-800'
                        : submitted && isCorrect
                          ? 'h-4 w-4 border-white bg-green-600 dark:border-gray-900'
                          : submitted && !isCorrect
                            ? 'h-4 w-4 border-white bg-red-600 dark:border-gray-900'
                            : 'h-4 w-4 border-white bg-blue-600 dark:border-gray-900'
                    }`}
                    style={{ boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)' }}
                  />
                  {/* Show coordinates while dragging */}
                  {isDragging && (
                    <div className="mt-1 whitespace-nowrap rounded bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white shadow-lg">
                      ({point.x}; {point.y})
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show correct points after submission if wrong */}
          {submitted && !isCorrect && task.correctPoints.map((point, index) => {
            const x = (point.x - gridSize.minX) * cellSize + offsetX;
            const y = (gridSize.maxY - point.y) * cellSize + offsetY;

            // Only show if not already placed correctly
            const isPlaced = placedPoints.some((p) => p.x === point.x && p.y === point.y);
            if (isPlaced) return null;

            return (
              <div
                key={`correct-${index}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <div 
                  className="h-4 w-4 rounded-full border-2 border-green-600 bg-green-100 dark:bg-green-900/30"
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                />
                <div className="mt-0.5 rounded bg-green-50/90 px-1 text-xs font-semibold text-green-700 shadow-sm dark:bg-green-900/50 dark:text-green-400">
                  ({point.x}; {point.y})
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  };

  const maxPoints = task.correctPoints.length;
  const remainingPoints = maxPoints - placedPoints.length;

  return (
    <TaskCard question={task.question}>
      <div ref={containerRef} className="flex flex-col gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {allowMultiplePoints
            ? 'Клацніть на площині, щоб поставити точку. Перетягніть точку для корекції позиції.'
            : 'Клацніть на площині, щоб поставити точку. Перетягніть точку для корекції позиції.'}
          {!submitted && allowMultiplePoints && (
            <span className={`ml-2 font-medium ${remainingPoints === 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
              ({placedPoints.length}/{maxPoints})
            </span>
          )}
        </div>

        {renderGrid()}

        {/* Placed points list */}
        {/* {placedPoints.length > 0 && (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Поставлені точки:</strong>{' '}
            {placedPoints.map((p, i) => (
              <span key={i}>
                ({p.x}; {p.y}){i < placedPoints.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )} */}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitted || isLocked || placedPoints.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Підтвердити
          </button>
          <button
            onClick={handleClear}
            disabled={submitted || isLocked}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Очистити
          </button>
        </div>

        {submitted && isCorrect === false && (
          <div className="mt-2 space-y-2">
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              ❌ Неправильно
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Правильні точки: {task.correctPoints.map((p) => `(${p.x}; ${p.y})`).join(', ')}
            </div>
          </div>
        )}
      </div>
    </TaskCard>
  );
}
