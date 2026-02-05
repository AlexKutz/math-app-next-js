'use client';

import { TCoordinatePlaneTask } from '@/types/task';
import { useEffect, useState } from 'react';
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

  // Default grid size or use custom from task
  const gridSize = task.gridSize || { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  const cellSize = 30; // pixels per unit
  const allowMultiplePoints = task.allowMultiplePoints !== false; // Default to true if not specified
  const axisLabelStep = task.axisLabelStep || 1; // Default to 1 (show all integers)

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

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to grid coordinates
    // Round to nearest grid cell
    const x = Math.round(clickX / cellSize) + gridSize.minX;
    const y = gridSize.maxY - Math.round(clickY / cellSize);

    // Check if point is within bounds
    if (x < gridSize.minX || x > gridSize.maxX || y < gridSize.minY || y > gridSize.maxY) {
      return;
    }

    // Check if point already exists
    const existingIndex = placedPoints.findIndex((p) => p.x === x && p.y === y);
    
    if (existingIndex !== -1) {
      // Remove point if clicked again
      setPlacedPoints(placedPoints.filter((_, i) => i !== existingIndex));
    } else {
      // Add new point based on mode
      if (allowMultiplePoints) {
        // Multi-point mode: add to existing points
        setPlacedPoints([...placedPoints, { x, y }]);
      } else {
        // Single-point mode: replace existing point
        setPlacedPoints([{ x, y }]);
      }
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

  const renderGrid = () => {
    const width = (gridSize.maxX - gridSize.minX) * cellSize;
    const height = (gridSize.maxY - gridSize.minY) * cellSize;

    return (
      <div className="flex justify-center">
        <div
          onClick={handlePlaneClick}
          className={`relative border-2 border-gray-400 bg-white dark:bg-gray-900 ${
            submitted || isLocked ? 'cursor-not-allowed' : 'cursor-crosshair'
          }`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
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
              const x = i * cellSize;
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
              const y = i * cellSize;
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
              // Skip labels based on step, but always show 0
              if (xValue !== 0 && xValue % axisLabelStep !== 0) return null;
              const x = i * cellSize;
              return (
                <text
                  key={`x-label-${i}`}
                  x={x}
                  y={(-gridSize.minY + 0.5) * cellSize}
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
              // Skip labels based on step, but always show 0
              if (yValue !== 0 && yValue % axisLabelStep !== 0) return null;
              const y = i * cellSize;
              return (
                <text
                  key={`y-label-${i}`}
                  x={(-gridSize.minX - 0.5) * cellSize}
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
            const x = (point.x - gridSize.minX) * cellSize;
            const y = (gridSize.maxY - point.y) * cellSize;

            return (
              <div
                key={index}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 border-white dark:border-gray-900 ${
                    submitted && isCorrect
                      ? 'bg-green-600'
                      : submitted && !isCorrect
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                  }`}
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                />
              </div>
            );
          })}

          {/* Show correct points after submission if wrong */}
          {submitted && !isCorrect && task.correctPoints.map((point, index) => {
            const x = (point.x - gridSize.minX) * cellSize;
            const y = (gridSize.maxY - point.y) * cellSize;

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
    );
  };

  return (
    <TaskCard question={task.question}>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {allowMultiplePoints
            ? 'Клацніть на координатній площині, щоб поставити точку. Клацніть на точку знову, щоб видалити.'
            : 'Клацніть на координатній площині, щоб поставити точку. Клацніть в іншому місці, щоб перемістити точку.'}
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
