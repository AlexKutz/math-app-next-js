'use client';

interface ProgressBarProps {
  percent: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  percent,
  label,
  size = 'md',
  color = 'gradient',
  showPercentage = true,
  className,
}: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    gradient: 'bg-linear-to-r from-blue-600 to-purple-600',
  };

  return (
    <div className={`w-full ${className || ''}`}>
      {(label || showPercentage) && (
        <div className='mb-1 flex items-center justify-between text-sm'>
          {label && <span className='text-muted-foreground'>{label}</span>}
          {showPercentage && (
            <span className='font-medium text-foreground'>{Math.round(clampedPercent)}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${
          sizeClasses[size]
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            colorClasses[color]
          }`}
          style={{ width: `${clampedPercent}%` }}
          role='progressbar'
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
