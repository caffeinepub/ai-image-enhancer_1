import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, ImageIcon, Upload, Layers, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { UploadProgress } from '@/hooks/useQueries';
import { ImageEnhancementControls, DEFAULT_ENHANCEMENT_VALUES, type EnhancementValues } from './ImageEnhancementControls';
import { upscaleImage, applyAdjustments, rotate90, type CropRect } from '../utils/imageProcessing';
import { useCropSelection } from '../hooks/useCropSelection';

interface ImageComparisonProps {
    originalUrl: string;
    enhancedUrl: string | null;
    isLoading: boolean;
    error: string | null;
    uploadProgress?: UploadProgress | null;
}

export function ImageComparison({
    originalUrl,
    enhancedUrl,
    isLoading,
    error,
    uploadProgress,
}: ImageComparisonProps) {
    // The base canvas after upscaling (and any 90° rotations applied)
    const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
    // The output canvas shown to the user (adjustments applied on top of base)
    const outputCanvasRef = useRef<HTMLCanvasElement>(null);
    // Container ref for measuring display size for crop overlay
    const containerRef = useRef<HTMLDivElement>(null);

    const [values, setValues] = useState<EnhancementValues>(DEFAULT_ENHANCEMENT_VALUES);
    const [isProcessingCanvas, setIsProcessingCanvas] = useState(false);
    const [appliedCrop, setAppliedCrop] = useState<CropRect | null>(null);
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

    const isUploading = isLoading && uploadProgress?.phase === 'uploading';
    const isEnhancing = isLoading && (!uploadProgress || uploadProgress.phase === 'enhancing');
    const uploadPercent = Math.round((uploadProgress?.fraction ?? 0) * 100);

    // Crop selection hook
    const crop = useCropSelection(
        displaySize.w,
        displaySize.h,
        baseCanvasRef.current?.width ?? 1,
        baseCanvasRef.current?.height ?? 1
    );

    // Load and upscale the enhanced image when it arrives
    useEffect(() => {
        if (!enhancedUrl) {
            baseCanvasRef.current = null;
            setAppliedCrop(null);
            setValues(DEFAULT_ENHANCEMENT_VALUES);
            return;
        }

        let cancelled = false;
        setIsProcessingCanvas(true);

        upscaleImage(enhancedUrl).then((canvas) => {
            if (cancelled) return;
            baseCanvasRef.current = canvas;
            setAppliedCrop(null);
            setValues(DEFAULT_ENHANCEMENT_VALUES);
            setIsProcessingCanvas(false);
        }).catch(() => {
            if (!cancelled) setIsProcessingCanvas(false);
        });

        return () => { cancelled = true; };
    }, [enhancedUrl]);

    // Re-render the output canvas whenever base canvas or adjustments change
    useEffect(() => {
        const base = baseCanvasRef.current;
        const out = outputCanvasRef.current;
        if (!base || !out) return;

        const result = applyAdjustments(base, {
            brightness: values.brightness,
            contrast: values.contrast,
            saturation: values.saturation,
            sharpness: values.sharpness,
            noiseReduction: values.noiseReduction,
            rotation: values.rotation,
            cropRect: appliedCrop,
        });

        out.width = result.width;
        out.height = result.height;
        const ctx = out.getContext('2d')!;
        ctx.drawImage(result, 0, 0);

        // Update display size for crop overlay
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDisplaySize({ w: rect.width, h: rect.height });
        }
    }, [values, appliedCrop, baseCanvasRef.current]);

    // Measure container on resize
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const rect = el.getBoundingClientRect();
            setDisplaySize({ w: rect.width, h: rect.height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const handleReset = useCallback(() => {
        setValues(DEFAULT_ENHANCEMENT_VALUES);
        setAppliedCrop(null);
        crop.cancelCrop();
    }, [crop]);

    const handleRotate90 = useCallback((clockwise: boolean) => {
        if (!baseCanvasRef.current) return;
        baseCanvasRef.current = rotate90(baseCanvasRef.current, clockwise);
        setAppliedCrop(null);
        // Trigger re-render by nudging values
        setValues(v => ({ ...v }));
    }, []);

    const handleCropConfirm = useCallback(() => {
        const rect = crop.confirmCrop();
        if (rect && baseCanvasRef.current) {
            // Apply crop permanently to base canvas
            const { x, y, w, h } = rect;
            const cropped = document.createElement('canvas');
            cropped.width = Math.round(w);
            cropped.height = Math.round(h);
            const ctx = cropped.getContext('2d')!;
            ctx.drawImage(baseCanvasRef.current, Math.round(x), Math.round(y), Math.round(w), Math.round(h), 0, 0, Math.round(w), Math.round(h));
            baseCanvasRef.current = cropped;
            setAppliedCrop(null);
            setValues(v => ({ ...v }));
        }
    }, [crop]);

    const handleDownload = useCallback(() => {
        const out = outputCanvasRef.current;
        if (!out) return;
        const url = out.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixelboost-enhanced.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, []);

    const showEnhanced = !isLoading && !error && enhancedUrl && !isProcessingCanvas;

    return (
        <div className="w-full animate-fade-in">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-charcoal-border" />
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-charcoal-elevated border border-charcoal-border">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium font-display text-foreground">Comparison</span>
                </div>
                <div className="h-px flex-1 bg-charcoal-border" />
            </div>

            {/* Before / After grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="card-gradient rounded-2xl overflow-hidden border border-charcoal-border">
                    <div className="px-4 py-3 border-b border-charcoal-border flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground font-display">Original</span>
                    </div>
                    <div className="bg-charcoal-elevated min-h-[240px] flex items-center justify-center">
                        <img
                            src={originalUrl}
                            alt="Original"
                            className="w-full max-h-[320px] object-contain"
                        />
                    </div>
                </div>

                {/* Enhanced */}
                <div className={`card-gradient rounded-2xl overflow-hidden border transition-all duration-500 ${
                    showEnhanced ? 'border-primary/40 glow-amber-sm' : 'border-charcoal-border'
                }`}>
                    <div className="px-4 py-3 border-b border-charcoal-border flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${showEnhanced ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium font-display ${showEnhanced ? 'text-primary' : 'text-muted-foreground'}`}>
                            AI Enhanced
                        </span>
                        {showEnhanced && (
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                Ready
                            </span>
                        )}
                    </div>

                    <div className="bg-charcoal-elevated min-h-[240px] flex items-center justify-center relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4 p-8 w-full max-w-xs">
                                {/* Spinner */}
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-2 border-charcoal-border" />
                                    <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                    <div className="absolute inset-2 rounded-full border border-t-primary/40 border-r-transparent border-b-transparent border-l-transparent animate-spin-slow" />
                                    {isUploading ? (
                                        <Upload className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse-amber" />
                                    ) : (
                                        <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse-amber" />
                                    )}
                                </div>

                                <div className="text-center">
                                    {isUploading ? (
                                        <>
                                            <p className="text-sm font-medium text-foreground mb-1">
                                                Uploading… {uploadPercent}%
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Sending image to the chain
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-foreground mb-1">
                                                Enhancing your image…
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Processing in 10 segments for maximum quality
                                            </p>
                                        </>
                                    )}
                                </div>

                                {isEnhancing && (
                                    <div className="w-full">
                                        <div className="flex items-center gap-1 justify-center mb-2">
                                            <Layers className="w-3 h-3 text-primary/70" />
                                            <span className="text-xs text-primary/70 font-display font-medium">
                                                10-segment parallel pipeline
                                            </span>
                                        </div>
                                        <div className="flex gap-1 justify-center">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-1.5 flex-1 rounded-full bg-primary/20 overflow-hidden"
                                                >
                                                    <div
                                                        className="h-full rounded-full bg-primary shimmer-bg"
                                                        style={{ animationDelay: `${i * 0.12}s` }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center mt-2">
                                            Applying 4K glow &amp; vibrancy boost…
                                        </p>
                                    </div>
                                )}

                                {isUploading && (
                                    <div className="w-full space-y-1.5">
                                        <Progress
                                            value={uploadPercent}
                                            className="h-1.5 bg-charcoal-border [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-300"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Uploading chunks</span>
                                            <span>{uploadPercent}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-3 p-8 text-center">
                                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-destructive" />
                                </div>
                                <p className="text-sm font-medium text-destructive">Enhancement failed</p>
                                <p className="text-xs text-muted-foreground">Please try again with a different image</p>
                            </div>
                        ) : showEnhanced ? (
                            /* Canvas output with crop overlay */
                            <div
                                ref={containerRef}
                                className="relative w-full flex items-center justify-center"
                                style={{ cursor: crop.isActive ? 'crosshair' : 'default' }}
                                onMouseDown={crop.isActive ? crop.handleMouseDown : undefined}
                                onMouseMove={crop.isActive ? crop.handleMouseMove : undefined}
                                onMouseUp={crop.isActive ? crop.handleMouseUp : undefined}
                                onMouseLeave={crop.isActive ? crop.handleMouseUp : undefined}
                            >
                                <canvas
                                    ref={outputCanvasRef}
                                    className="w-full max-h-[320px] object-contain animate-scale-in"
                                    style={{ display: 'block' }}
                                />

                                {/* Crop selection overlay */}
                                {crop.isActive && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Dimming overlay */}
                                        <div className="absolute inset-0 bg-black/40" />
                                        {/* Selection rectangle */}
                                        {crop.displayRect && crop.displayRect.w > 0 && crop.displayRect.h > 0 && (
                                            <div
                                                className="absolute border-2 border-primary bg-transparent"
                                                style={{
                                                    left: crop.displayRect.x,
                                                    top: crop.displayRect.y,
                                                    width: crop.displayRect.w,
                                                    height: crop.displayRect.h,
                                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Enhancement controls panel — shown once enhanced image is ready */}
            {showEnhanced && (
                <div className="mt-6 animate-fade-in">
                    <ImageEnhancementControls
                        values={values}
                        onChange={setValues}
                        onReset={handleReset}
                        onRotate90={handleRotate90}
                        onCropActivate={crop.activateCrop}
                        onCropConfirm={handleCropConfirm}
                        onCropCancel={crop.cancelCrop}
                        isCropActive={crop.isActive}
                        onDownload={handleDownload}
                    />
                </div>
            )}
        </div>
    );
}
