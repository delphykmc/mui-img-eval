import { useEffect, useRef, useCallback } from 'react';

export function CompareCanvas({
  image,
  zoomLevel,
  offset,
  onDragStart,
  onDragMove,
  onDragEnd,
  dragging,
}: {
  image: HTMLImageElement | null;
  zoomLevel: number;
  offset: { x: number; y: number };
  onDragStart: (e: React.MouseEvent) => void;
  onDragMove: (e: React.MouseEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = image.width * zoomLevel;
    const height = image.height * zoomLevel;

    const clampedX = Math.min(Math.max(offset.x, container.clientWidth - width), 0);
    const clampedY = Math.min(Math.max(offset.y, container.clientHeight - height), 0);

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, clampedX, clampedY, width, height);
  }, [image, zoomLevel, offset]);

  useEffect(() => {
    if (!image) return;
    draw();
  }, [image, zoomLevel, offset, draw]);

  useEffect(() => {
    const container = containerRef.current;
    let observer: ResizeObserver | null = null;

    if (container) {
      observer = new ResizeObserver(() => {
        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          draw();
        }, 30); // 30ms debounce
      });

      observer.observe(container);
    }

    return () => {
      if (observer) observer.disconnect();
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [image, draw]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        style={{ width: '100%', height: '100%', cursor: dragging ? 'grabbing' : 'grab' }}
      />
    </div>
  );
}
