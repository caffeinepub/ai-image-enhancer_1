import { Sparkles } from 'lucide-react';

export function HeroBanner() {
    return (
        <div className="relative w-full overflow-hidden rounded-2xl mb-10">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/assets/generated/hero-banner.dim_1200x400.png')" }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal/95 via-charcoal/80 to-charcoal/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-10 px-8 py-12 md:py-16 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-primary/30 glow-amber-sm">
                        <img
                            src="/assets/generated/app-logo.dim_128x128.png"
                            alt="PixelBoost Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-primary uppercase tracking-widest">
                            AI-Powered Enhancement
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold font-display text-gradient-amber mb-2">
                        PixelBoost
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                        Transform low-quality photos into stunning, high-definition images with our AI enhancement engine.
                    </p>
                </div>
            </div>
        </div>
    );
}
