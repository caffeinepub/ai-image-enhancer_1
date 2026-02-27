import { useCallback, useRef, useState } from 'react';
import type { CropRect } from '../utils/imageProcessing';

export interface CropSelectionState {
    isActive: boolean;
    rect: CropRect | null;
    isDragging: boolean;
}

export function useCropSelection(canvasDisplayWidth: number, canvasDisplayHeight: number, imageNaturalWidth: number, imageNaturalHeight: number) {
    const [isActive, setIsActive] = useState(false);
    const [rect, setRect] = useState<CropRect | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    // Scale factor from display pixels to image pixels
    const scaleX = imageNaturalWidth / (canvasDisplayWidth || 1);
    const scaleY = imageNaturalHeight / (canvasDisplayHeight || 1);

    const getRelativePos = useCallback((e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
        const bounds = el.getBoundingClientRect();
        let clientX: number, clientY: number;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        return {
            x: Math.max(0, Math.min(canvasDisplayWidth, clientX - bounds.left)),
            y: Math.max(0, Math.min(canvasDisplayHeight, clientY - bounds.top)),
        };
    }, [canvasDisplayWidth, canvasDisplayHeight]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isActive || !overlayRef.current) return;
        const pos = getRelativePos(e, overlayRef.current);
        startRef.current = pos;
        setRect({ x: pos.x * scaleX, y: pos.y * scaleY, w: 0, h: 0 });
        setIsDragging(true);
    }, [isActive, getRelativePos, scaleX, scaleY]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !startRef.current || !overlayRef.current) return;
        const pos = getRelativePos(e, overlayRef.current);
        const x = Math.min(startRef.current.x, pos.x);
        const y = Math.min(startRef.current.y, pos.y);
        const w = Math.abs(pos.x - startRef.current.x);
        const h = Math.abs(pos.y - startRef.current.y);
        setRect({ x: x * scaleX, y: y * scaleY, w: w * scaleX, h: h * scaleY });
    }, [isDragging, getRelativePos, scaleX, scaleY]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const activateCrop = useCallback(() => {
        setIsActive(true);
        setRect(null);
    }, []);

    const cancelCrop = useCallback(() => {
        setIsActive(false);
        setRect(null);
        setIsDragging(false);
        startRef.current = null;
    }, []);

    const confirmCrop = useCallback((): CropRect | null => {
        if (!rect || rect.w < 4 || rect.h < 4) return null;
        setIsActive(false);
        setIsDragging(false);
        startRef.current = null;
        return rect;
    }, [rect]);

    // Display rect in overlay coordinates (display pixels)
    const displayRect = rect
        ? {
            x: rect.x / scaleX,
            y: rect.y / scaleY,
            w: rect.w / scaleX,
            h: rect.h / scaleY,
        }
        : null;

    return {
        isActive,
        rect,
        displayRect,
        isDragging,
        overlayRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        activateCrop,
        cancelCrop,
        confirmCrop,
    };
}
