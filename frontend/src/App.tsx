import { useState, useCallback, useRef } from 'react';
import { HeroBanner } from './components/HeroBanner';
import { ImageUploader } from './components/ImageUploader';
import { ImageComparison } from './components/ImageComparison';
import { useProcessImage, type UploadProgress } from './hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Heart, Zap, Star } from 'lucide-react';
import { EnhancementMode } from './backend';

type AppState = 'idle' | 'ready' | 'processing' | 'done' | 'error';

export default function App() {
    const [appState, setAppState] = useState<AppState>('idle');
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [enhancementMode, setEnhancementMode] = useState<EnhancementMode>(EnhancementMode.standard);

    // Store raw file bytes and type so we can upload them directly
    const imageBytesRef = useRef<Uint8Array | null>(null);
    const fileTypeRef = useRef<string>('image/jpeg');

    // Track original blob URL for cleanup
    const originalUrlRef = useRef<string | null>(null);

    const processImage = useProcessImage();

    const handleImageSelected = useCallback(
        (file: File, previewUrl: string, data: Uint8Array) => {
            // Revoke previous original URL to free memory
            if (originalUrlRef.current && originalUrlRef.current !== previewUrl) {
                URL.revokeObjectURL(originalUrlRef.current);
            }
            originalUrlRef.current = previewUrl;

            imageBytesRef.current = data;
            fileTypeRef.current = file.type || 'image/jpeg';

            setOriginalUrl(previewUrl);
            setEnhancedUrl(null);
            setErrorMessage(null);
            setUploadProgress(null);
            setAppState('ready');
        },
        []
    );

    const handleEnhance = useCallback(async () => {
        if (!originalUrl || !imageBytesRef.current) return;
        setAppState('processing');
        setErrorMessage(null);
        setUploadProgress({ phase: 'uploading', fraction: 0 });

        try {
            const result = await processImage.mutateAsync({
                imageBytes: imageBytesRef.current,
                fileType: fileTypeRef.current,
                enhancementMode,
                onProgress: (p) => setUploadProgress(p),
            });
            setEnhancedUrl(result.enhancedUrl);
            setUploadProgress(null);
            setAppState('done');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Enhancement failed. Please try again.';
            setErrorMessage(msg);
            setUploadProgress(null);
            setAppState('error');
        }
    }, [originalUrl, enhancementMode, processImage]);

    const handleReset = useCallback(() => {
        setAppState('idle');
        setOriginalUrl(null);
        setEnhancedUrl(null);
        setErrorMessage(null);
        setUploadProgress(null);
        imageBytesRef.current = null;
    }, []);

    const isProcessing = appState === 'processing';

    const appId = encodeURIComponent(
        typeof window !== 'undefined' ? window.location.hostname : 'pixelboost-app'
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-charcoal-border bg-charcoal-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-primary/30">
                            <img
                                src="/assets/generated/app-logo.dim_128x128.png"
                                alt="PixelBoost"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="font-bold font-display text-foreground text-lg tracking-tight">
                            Pixel<span className="text-gradient-amber">Boost</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>AI Image Enhancer</span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
                <HeroBanner />

                {/* Enhancement Mode Toggle */}
                <div className="mb-5 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold font-display text-foreground">
                            Enhancement Mode
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Choose how your image is processed
                        </span>
                    </div>
                    <div className="inline-flex rounded-xl border border-charcoal-border bg-charcoal-card p-1 gap-1">
                        {/* Standard mode button */}
                        <button
                            onClick={() => !isProcessing && setEnhancementMode(EnhancementMode.standard)}
                            disabled={isProcessing}
                            aria-pressed={enhancementMode === EnhancementMode.standard}
                            className={[
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all duration-200',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                                isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                enhancementMode === EnhancementMode.standard
                                    ? 'bg-primary text-primary-foreground shadow-md glow-amber'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-charcoal-border/40',
                            ].join(' ')}
                        >
                            <Zap className="w-4 h-4" />
                            Standard
                        </button>

                        {/* Anime mode button */}
                        <button
                            onClick={() => !isProcessing && setEnhancementMode(EnhancementMode.anime)}
                            disabled={isProcessing}
                            aria-pressed={enhancementMode === EnhancementMode.anime}
                            className={[
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all duration-200',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                                isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                enhancementMode === EnhancementMode.anime
                                    ? 'bg-primary text-primary-foreground shadow-md glow-amber'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-charcoal-border/40',
                            ].join(' ')}
                        >
                            <Star className="w-4 h-4" />
                            Anime
                        </button>
                    </div>

                    {/* Mode description */}
                    <p className="mt-2 text-xs text-muted-foreground">
                        {enhancementMode === EnhancementMode.standard
                            ? 'Balanced contrast, sharpness, and saturation boost for everyday photos.'
                            : 'Stronger edge sharpening, vivid saturation, and vibrant color boost optimised for anime-style images.'}
                    </p>
                </div>

                {/* Upload card */}
                <div className="card-gradient card-gradient-hover rounded-2xl p-6 md:p-8 shadow-card-depth mb-6 transition-all duration-300">
                    <div className="mb-5">
                        <h2 className="text-xl font-bold font-display text-foreground mb-1">
                            Upload Your Image
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Select a low-quality JPEG or PNG photo to enhance
                        </p>
                    </div>

                    <ImageUploader
                        onImageSelected={handleImageSelected}
                        isProcessing={isProcessing}
                        onReset={handleReset}
                        hasResult={appState === 'done'}
                    />

                    {/* Enhance button */}
                    {(appState === 'ready' || appState === 'error') && (
                        <div className="mt-5 flex items-center gap-3 animate-fade-in">
                            <Button
                                onClick={handleEnhance}
                                disabled={processImage.isPending}
                                size="lg"
                                className="
                                    bg-primary text-primary-foreground font-semibold font-display
                                    px-8 rounded-xl glow-amber
                                    hover:bg-primary/90 transition-all duration-300
                                    flex items-center gap-2
                                "
                            >
                                {enhancementMode === EnhancementMode.anime ? (
                                    <Star className="w-4 h-4" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                Enhance Image
                                <span className="ml-1 text-xs font-normal opacity-80">
                                    ({enhancementMode === EnhancementMode.anime ? 'Anime' : 'Standard'})
                                </span>
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="ghost"
                                size="lg"
                                className="rounded-xl text-muted-foreground hover:text-foreground"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="mt-5 flex items-center gap-3 animate-fade-in">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-4 h-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                {uploadProgress?.phase === 'uploading'
                                    ? `Uploading… ${Math.round((uploadProgress.fraction) * 100)}%`
                                    : 'Enhancing your image on-chain…'}
                            </div>
                        </div>
                    )}

                    {appState === 'done' && (
                        <div className="mt-5 flex items-center gap-3 animate-fade-in">
                            <div className="flex items-center gap-2 text-sm text-primary">
                                <Sparkles className="w-4 h-4" />
                                Enhancement complete!
                            </div>
                            <Button
                                onClick={handleReset}
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-muted-foreground hover:text-foreground ml-auto"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Enhance another
                            </Button>
                        </div>
                    )}
                </div>

                {/* Comparison view */}
                {(isProcessing || appState === 'done' || appState === 'error') && originalUrl && (
                    <div className="card-gradient rounded-2xl p-6 md:p-8 shadow-card-depth animate-fade-in">
                        <ImageComparison
                            originalUrl={originalUrl}
                            enhancedUrl={enhancedUrl}
                            isLoading={isProcessing}
                            error={appState === 'error' ? errorMessage : null}
                            uploadProgress={uploadProgress}
                        />
                    </div>
                )}

                {/* How it works */}
                {appState === 'idle' && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                        {[
                            {
                                step: '01',
                                title: 'Upload',
                                desc: 'Drop or select a JPEG or PNG image.',
                                icon: '📤',
                            },
                            {
                                step: '02',
                                title: 'Enhance',
                                desc: 'Choose Standard or Anime mode — our on-chain AI pipeline boosts contrast, sharpness, and saturation.',
                                icon: '✨',
                            },
                            {
                                step: '03',
                                title: 'Download',
                                desc: 'Save your enhanced image in full-quality PNG format.',
                                icon: '💾',
                            },
                        ].map(({ step, title, desc, icon }) => (
                            <div
                                key={step}
                                className="card-gradient rounded-2xl p-5 border border-charcoal-border flex flex-col gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{icon}</span>
                                    <span className="text-xs font-mono text-primary/60 font-bold">{step}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold font-display text-foreground mb-1">{title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-charcoal-border mt-auto py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>© {new Date().getFullYear()} PixelBoost. All rights reserved.</span>
                    <span className="flex items-center gap-1.5">
                        Built with <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> using{' '}
                        <a
                            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            caffeine.ai
                        </a>
                    </span>
                </div>
            </footer>
        </div>
    );
}
