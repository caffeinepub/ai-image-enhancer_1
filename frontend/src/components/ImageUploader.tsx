import React, { useCallback, useRef, useState } from 'react';
import { Upload, ImageIcon, AlertCircle, X } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

interface ImageUploaderProps {
    onImageSelected: (file: File, previewUrl: string, imageData: Uint8Array) => void;
    isProcessing: boolean;
    onReset: () => void;
    hasResult: boolean;
}

export function ImageUploader({ onImageSelected, isProcessing, onReset, hasResult }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateAndProcess = useCallback(
        async (file: File) => {
            setError(null);

            if (!ACCEPTED_TYPES.includes(file.type)) {
                setError('Only JPEG and PNG images are supported.');
                return;
            }

            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            setFileName(file.name);

            const arrayBuffer = await file.arrayBuffer();
            const imageData = new Uint8Array(arrayBuffer);
            onImageSelected(file, previewUrl, imageData);
        },
        [onImageSelected]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) validateAndProcess(file);
        },
        [validateAndProcess]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) validateAndProcess(file);
        },
        [validateAndProcess]
    );

    const handleReset = useCallback(() => {
        setPreview(null);
        setFileName(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = '';
        onReset();
    }, [onReset]);

    const handleClick = useCallback(() => {
        if (!isProcessing && !hasResult) {
            inputRef.current?.click();
        }
    }, [isProcessing, hasResult]);

    return (
        <div className="w-full">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
            />

            {!preview ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleClick}
                    className={`
                        relative flex flex-col items-center justify-center
                        w-full min-h-[280px] rounded-2xl border-2 border-dashed
                        cursor-pointer transition-all duration-300
                        ${isDragging
                            ? 'upload-zone-active border-primary'
                            : 'border-charcoal-border hover:border-primary/50 hover:bg-primary/5'
                        }
                        card-gradient
                    `}
                >
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                        <div className={`
                            w-20 h-20 rounded-2xl flex items-center justify-center
                            transition-all duration-300
                            ${isDragging ? 'bg-primary/20 glow-amber-sm' : 'bg-charcoal-elevated'}
                        `}>
                            <Upload
                                className={`w-9 h-9 transition-colors duration-300 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
                            />
                        </div>

                        <div>
                            <p className="text-lg font-semibold font-display text-foreground mb-1">
                                Drop your image here
                            </p>
                            <p className="text-sm text-muted-foreground">
                                or{' '}
                                <span className="text-primary font-medium cursor-pointer hover:underline">
                                    click to browse
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="px-2 py-1 rounded-md bg-charcoal-elevated border border-charcoal-border">
                                JPEG
                            </span>
                            <span className="px-2 py-1 rounded-md bg-charcoal-elevated border border-charcoal-border">
                                PNG
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative rounded-2xl overflow-hidden card-gradient border border-charcoal-border">
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Selected preview"
                            className="w-full max-h-[320px] object-contain bg-charcoal-elevated"
                        />
                        {!isProcessing && !hasResult && (
                            <button
                                onClick={handleReset}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-charcoal/80 border border-charcoal-border flex items-center justify-center hover:bg-destructive/80 transition-colors"
                            >
                                <X className="w-4 h-4 text-foreground" />
                            </button>
                        )}
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{fileName}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
