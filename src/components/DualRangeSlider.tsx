import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  className?: string;
  showTicks?: boolean;
  tickLabels?: string[];
}

const DualRangeSlider = ({
  min,
  max,
  value,
  onValueChange,
  className,
  showTicks = false,
  tickLabels,
}: DualRangeSliderProps) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [minVal, maxVal] = value;

  const getPercentage = useCallback((val: number) => ((val - min) / (max - min)) * 100, [min, max]);

  const handleMouseDown = useCallback((type: 'min' | 'max') => {
    setIsDragging(type);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const newValue = Math.round(min + (percentage / 100) * (max - min));

    if (isDragging === 'min') {
      onValueChange([Math.min(newValue, maxVal), maxVal]);
    } else {
      onValueChange([minVal, Math.max(newValue, minVal)]);
    }
  }, [isDragging, min, max, minVal, maxVal, onValueChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Add event listeners
  React.useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent) => handleMouseMove(e);
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleMouseMove(e);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const minPercentage = getPercentage(minVal);
  const maxPercentage = getPercentage(maxVal);

  return (
    <div className={cn('relative w-full', className)}>
      {showTicks && tickLabels && (
        <div className="flex justify-between mb-2 text-xs text-muted-foreground">
          {tickLabels.map((label, index) => (
            <span key={index} className="text-center">
              {label}
            </span>
          ))}
        </div>
      )}
      
      <div
        ref={trackRef}
        className="relative h-2 bg-muted rounded-full cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percentage = ((e.clientX - rect.left) / rect.width) * 100;
          const newValue = Math.round(min + (percentage / 100) * (max - min));
          
          // Determine which handle is closer
          const distanceToMin = Math.abs(newValue - minVal);
          const distanceToMax = Math.abs(newValue - maxVal);
          
          if (distanceToMin < distanceToMax) {
            onValueChange([Math.min(newValue, maxVal), maxVal]);
          } else {
            onValueChange([minVal, Math.max(newValue, minVal)]);
          }
        }}
      >
        {/* Active range */}
        <div
          className="absolute h-full bg-primary rounded-full transition-all duration-200"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />
        
        {/* Min handle */}
        <button
          type="button"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-primary rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/20",
            isDragging === 'min' && "scale-110 ring-4 ring-primary/30"
          )}
          style={{ left: `${minPercentage}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          onMouseDown={() => handleMouseDown('min')}
          onTouchStart={() => handleMouseDown('min')}
          aria-label={`Minimum value: ${minVal}`}
        />
        
        {/* Max handle */}
        <button
          type="button"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-primary rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/20",
            isDragging === 'max' && "scale-110 ring-4 ring-primary/30"
          )}
          style={{ left: `${maxPercentage}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          onMouseDown={() => handleMouseDown('max')}
          onTouchStart={() => handleMouseDown('max')}
          aria-label={`Maximum value: ${maxVal}`}
        />
      </div>
      
      {showTicks && (
        <div className="flex justify-between mt-2">
          {Array.from({ length: max - min + 1 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 h-1 rounded-full transition-all duration-200",
                i + min >= minVal && i + min <= maxVal
                  ? "bg-primary scale-150"
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DualRangeSlider;