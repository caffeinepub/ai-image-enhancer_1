import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
    Sun, Contrast, Droplets, Zap, Wind, RotateCcw, RotateCw,
    Crop, Check, X, RefreshCw
} from 'lucide-react';

export interface EnhancementValues {
    brightness: number;      // -100 to +100, default 0
    contrast: number;        // -100 to +100, default 0
    saturation: number;      // 0 to 200, default 100
    sharpness: number;       // 0 to 100, default 0
    noiseReduction: number;  // 0 to 100, default 0
    rotation: number;        // -45 to +45, default 0
}

export const DEFAULT_ENHANCEMENT_VALUES: EnhancementValues = {
    brightness: 0,
    contrast: 0,
    saturation: 100,
    sharpness: 0,
    noiseReduction: 0,
    rotation: 0,
};

interface ImageEnhancementControlsProps {
    values: EnhancementValues;
    onChange: (values: EnhancementValues) => void;
    onReset: () => void;
    onRotate90: (clockwise: boolean) => void;
    onCropActivate: () => void;
    onCropConfirm: () => void;
    onCropCancel: () => void;
    isCropActive: boolean;
    onDownload: () => void;
}

interface SliderRowProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (v: number) => void;
    displayValue?: string;
}

function SliderRow({ icon, label, value, min, max, step = 1, onChange, displayValue }: SliderRowProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-primary/80">{icon}</span>
                    <span className="text-xs font-medium text-foreground font-display">{label}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                    {displayValue ?? value}
                </span>
            </div>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
                className="[&>span[role=slider]]:bg-primary [&>span[role=slider]]:border-primary/50 [&>span[data-orientation=horizontal]]:bg-charcoal-border [&>span[data-orientation=horizontal]>span]:bg-primary"
            />
        </div>
    );
}

export function ImageEnhancementControls({
    values,
    onChange,
    onReset,
    onRotate90,
    onCropActivate,
    onCropConfirm,
    onCropCancel,
    isCropActive,
    onDownload,
}: ImageEnhancementControlsProps) {
    const set = (key: keyof EnhancementValues) => (v: number) =>
        onChange({ ...values, [key]: v });

    return (
        <div className="w-full rounded-2xl border border-charcoal-border bg-charcoal-card overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-charcoal-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold font-display text-foreground">Enhancement Tools</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                </Button>
            </div>

            <div className="p-4 space-y-5">
                {/* Tone adjustments */}
                <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Tone
                    </p>
                    <div className="space-y-4">
                        <SliderRow
                            icon={<Sun className="w-3.5 h-3.5" />}
                            label="Brightness"
                            value={values.brightness}
                            min={-100}
                            max={100}
                            onChange={set('brightness')}
                            displayValue={values.brightness > 0 ? `+${values.brightness}` : `${values.brightness}`}
                        />
                        <SliderRow
                            icon={<Contrast className="w-3.5 h-3.5" />}
                            label="Contrast"
                            value={values.contrast}
                            min={-100}
                            max={100}
                            onChange={set('contrast')}
                            displayValue={values.contrast > 0 ? `+${values.contrast}` : `${values.contrast}`}
                        />
                    </div>
                </section>

                {/* Color */}
                <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Color
                    </p>
                    <SliderRow
                        icon={<Droplets className="w-3.5 h-3.5" />}
                        label="Saturation"
                        value={values.saturation}
                        min={0}
                        max={200}
                        onChange={set('saturation')}
                        displayValue={`${values.saturation}%`}
                    />
                </section>

                {/* Detail */}
                <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Detail
                    </p>
                    <div className="space-y-4">
                        <SliderRow
                            icon={<Zap className="w-3.5 h-3.5" />}
                            label="Sharpness"
                            value={values.sharpness}
                            min={0}
                            max={100}
                            onChange={set('sharpness')}
                        />
                        <SliderRow
                            icon={<Wind className="w-3.5 h-3.5" />}
                            label="Noise Reduction"
                            value={values.noiseReduction}
                            min={0}
                            max={100}
                            onChange={set('noiseReduction')}
                        />
                    </div>
                </section>

                {/* Transform */}
                <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Transform
                    </p>
                    <div className="space-y-4">
                        {/* Free rotation slider */}
                        <SliderRow
                            icon={<RotateCw className="w-3.5 h-3.5" />}
                            label="Rotation"
                            value={values.rotation}
                            min={-45}
                            max={45}
                            onChange={set('rotation')}
                            displayValue={`${values.rotation}°`}
                        />

                        {/* 90-degree rotation buttons */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex-1">Rotate 90°</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRotate90(false)}
                                className="h-8 px-3 border-charcoal-border bg-charcoal-elevated hover:bg-primary/10 hover:border-primary/40 gap-1.5 text-xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                CCW
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRotate90(true)}
                                className="h-8 px-3 border-charcoal-border bg-charcoal-elevated hover:bg-primary/10 hover:border-primary/40 gap-1.5 text-xs"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                CW
                            </Button>
                        </div>

                        {/* Crop controls */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex-1">Crop</span>
                            {!isCropActive ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCropActivate}
                                    className="h-8 px-3 border-charcoal-border bg-charcoal-elevated hover:bg-primary/10 hover:border-primary/40 gap-1.5 text-xs"
                                >
                                    <Crop className="w-3.5 h-3.5" />
                                    Select Crop
                                </Button>
                            ) : (
                                <div className="flex gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCropConfirm}
                                        className="h-8 px-3 border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-green-400 gap-1 text-xs"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Apply
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCropCancel}
                                        className="h-8 px-3 border-charcoal-border bg-charcoal-elevated hover:bg-destructive/10 hover:border-destructive/40 gap-1 text-xs"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Crop mode hint */}
                {isCropActive && (
                    <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary/90 animate-fade-in">
                        Drag on the image above to select a crop region, then click Apply.
                    </div>
                )}

                {/* Download */}
                <div className="pt-1 border-t border-charcoal-border">
                    <Button
                        onClick={onDownload}
                        className="w-full bg-primary text-primary-foreground font-semibold font-display hover:bg-primary/90 glow-amber transition-all duration-300 gap-2"
                    >
                        <span>Download Enhanced Image</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
