import { useCallback, useRef, useState } from 'react';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 6;

export function useZoomPan() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(Number((z + 0.25).toFixed(2)))), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(Number((z - 0.25).toFixed(2)))), []);
  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => clampZoom(Number((z - e.deltaY * 0.001).toFixed(2))));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [zoom, pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const onDoubleClick = useCallback(() => reset(), [reset]);

  return {
    zoom, pan, zoomIn, zoomOut, reset,
    handlers: { onWheel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp, onDoubleClick },
    style: { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'default' },
  };
}
