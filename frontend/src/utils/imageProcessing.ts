/**
 * Canvas-based image processing utilities.
 * All operations work on ImageData pixel arrays for real-time editing.
 */

/** Clamp a value between 0 and 255 */
function clamp(v: number): number {
    return Math.max(0, Math.min(255, Math.round(v)));
}

/** Convert RGB to HSL (all values 0–1) */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

/** Convert HSL to RGB (all values 0–1) */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    if (s === 0) {
        const v = Math.round(l * 255);
        return [v, v, v];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
        Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    ];
}

/**
 * Load an image URL into an HTMLImageElement.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Multi-step canvas upscaling: incrementally scale up to 2x using
 * intermediate steps to preserve quality, then apply sharpening.
 */
export async function upscaleImage(src: string): Promise<HTMLCanvasElement> {
    const img = await loadImage(src);
    const targetW = img.naturalWidth * 2;
    const targetH = img.naturalHeight * 2;

    // Step 1: draw at 1.5x
    const step1 = document.createElement('canvas');
    step1.width = Math.round(img.naturalWidth * 1.5);
    step1.height = Math.round(img.naturalHeight * 1.5);
    const ctx1 = step1.getContext('2d')!;
    ctx1.imageSmoothingEnabled = true;
    ctx1.imageSmoothingQuality = 'high';
    ctx1.drawImage(img, 0, 0, step1.width, step1.height);

    // Step 2: draw at 2x
    const step2 = document.createElement('canvas');
    step2.width = targetW;
    step2.height = targetH;
    const ctx2 = step2.getContext('2d')!;
    ctx2.imageSmoothingEnabled = true;
    ctx2.imageSmoothingQuality = 'high';
    ctx2.drawImage(step1, 0, 0, targetW, targetH);

    return step2;
}

/**
 * Apply a 3x3 convolution kernel to ImageData.
 * Returns a new ImageData with the kernel applied.
 */
function applyConvolution(imageData: ImageData, kernel: number[], divisor: number): ImageData {
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const px = Math.min(width - 1, Math.max(0, x + kx));
                    const py = Math.min(height - 1, Math.max(0, y + ky));
                    const idx = (py * width + px) * 4;
                    const kIdx = (ky + 1) * 3 + (kx + 1);
                    r += data[idx] * kernel[kIdx];
                    g += data[idx + 1] * kernel[kIdx];
                    b += data[idx + 2] * kernel[kIdx];
                }
            }
            const outIdx = (y * width + x) * 4;
            output[outIdx] = clamp(r / divisor);
            output[outIdx + 1] = clamp(g / divisor);
            output[outIdx + 2] = clamp(b / divisor);
            output[outIdx + 3] = data[outIdx + 3];
        }
    }
    return new ImageData(output, width, height);
}

/**
 * Apply sharpening to ImageData using an unsharp mask kernel.
 * intensity: 0–100
 */
export function applySharpen(imageData: ImageData, intensity: number): ImageData {
    if (intensity <= 0) return imageData;
    const t = intensity / 100;
    // Unsharp mask kernel: center weight increases with intensity
    const center = 1 + 8 * t;
    const edge = -t;
    const kernel = [
        edge, edge, edge,
        edge, center, edge,
        edge, edge, edge,
    ];
    return applyConvolution(imageData, kernel, 1);
}

/**
 * Apply a box blur (noise reduction) to ImageData.
 * intensity: 0–100 (maps to 0–2 blur radius passes)
 */
export function applyNoiseReduction(imageData: ImageData, intensity: number): ImageData {
    if (intensity <= 0) return imageData;
    const passes = Math.round((intensity / 100) * 2);
    let result = imageData;
    const blurKernel = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    for (let i = 0; i < passes; i++) {
        result = applyConvolution(result, blurKernel, 9);
    }
    return result;
}

/**
 * Apply brightness adjustment to ImageData.
 * brightness: -100 to +100 (0 = no change)
 */
export function applyBrightness(imageData: ImageData, brightness: number): ImageData {
    if (brightness === 0) return imageData;
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const offset = (brightness / 100) * 128;
    for (let i = 0; i < data.length; i += 4) {
        output[i] = clamp(data[i] + offset);
        output[i + 1] = clamp(data[i + 1] + offset);
        output[i + 2] = clamp(data[i + 2] + offset);
        output[i + 3] = data[i + 3];
    }
    return new ImageData(output, width, height);
}

/**
 * Apply contrast adjustment to ImageData.
 * contrast: -100 to +100 (0 = no change)
 */
export function applyContrast(imageData: ImageData, contrast: number): ImageData {
    if (contrast === 0) return imageData;
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
        output[i] = clamp(factor * (data[i] - 128) + 128);
        output[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
        output[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
        output[i + 3] = data[i + 3];
    }
    return new ImageData(output, width, height);
}

/**
 * Apply saturation adjustment to ImageData.
 * saturation: 0 (grayscale) to 200 (double saturation), 100 = no change
 */
export function applySaturation(imageData: ImageData, saturation: number): ImageData {
    if (saturation === 100) return imageData;
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const factor = saturation / 100;
    for (let i = 0; i < data.length; i += 4) {
        const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        const newS = Math.min(1, Math.max(0, s * factor));
        const [r, g, b] = hslToRgb(h, newS, l);
        output[i] = r;
        output[i + 1] = g;
        output[i + 2] = b;
        output[i + 3] = data[i + 3];
    }
    return new ImageData(output, width, height);
}

/**
 * Apply all adjustments to a canvas element and return a new canvas.
 */
export function applyAdjustments(
    sourceCanvas: HTMLCanvasElement,
    opts: {
        brightness: number;
        contrast: number;
        saturation: number;
        sharpness: number;
        noiseReduction: number;
        rotation: number; // degrees
        cropRect: CropRect | null;
    }
): HTMLCanvasElement {
    const { brightness, contrast, saturation, sharpness, noiseReduction, rotation, cropRect } = opts;

    // Create working canvas
    let workCanvas = document.createElement('canvas');
    workCanvas.width = sourceCanvas.width;
    workCanvas.height = sourceCanvas.height;
    const workCtx = workCanvas.getContext('2d')!;
    workCtx.drawImage(sourceCanvas, 0, 0);

    // Apply crop first if set
    if (cropRect && cropRect.w > 0 && cropRect.h > 0) {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = Math.round(cropRect.w);
        cropCanvas.height = Math.round(cropRect.h);
        const cropCtx = cropCanvas.getContext('2d')!;
        cropCtx.drawImage(
            workCanvas,
            Math.round(cropRect.x), Math.round(cropRect.y),
            Math.round(cropRect.w), Math.round(cropRect.h),
            0, 0,
            Math.round(cropRect.w), Math.round(cropRect.h)
        );
        workCanvas = cropCanvas;
    }

    // Apply rotation
    if (rotation !== 0) {
        const rad = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const newW = Math.round(workCanvas.width * cos + workCanvas.height * sin);
        const newH = Math.round(workCanvas.width * sin + workCanvas.height * cos);
        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = newW;
        rotCanvas.height = newH;
        const rotCtx = rotCanvas.getContext('2d')!;
        rotCtx.translate(newW / 2, newH / 2);
        rotCtx.rotate(rad);
        rotCtx.drawImage(workCanvas, -workCanvas.width / 2, -workCanvas.height / 2);
        workCanvas = rotCanvas;
    }

    // Get pixel data for pixel-level adjustments
    const ctx = workCanvas.getContext('2d')!;
    let imageData = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);

    // Apply pixel adjustments in order: noise reduction → brightness → contrast → saturation → sharpen
    imageData = applyNoiseReduction(imageData, noiseReduction);
    imageData = applyBrightness(imageData, brightness);
    imageData = applyContrast(imageData, contrast);
    imageData = applySaturation(imageData, saturation);
    imageData = applySharpen(imageData, sharpness);

    ctx.putImageData(imageData, 0, 0);
    return workCanvas;
}

export interface CropRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Rotate a canvas 90 degrees clockwise or counter-clockwise.
 */
export function rotate90(canvas: HTMLCanvasElement, clockwise: boolean): HTMLCanvasElement {
    const out = document.createElement('canvas');
    out.width = canvas.height;
    out.height = canvas.width;
    const ctx = out.getContext('2d')!;
    if (clockwise) {
        ctx.translate(out.width, 0);
        ctx.rotate(Math.PI / 2);
    } else {
        ctx.translate(0, out.height);
        ctx.rotate(-Math.PI / 2);
    }
    ctx.drawImage(canvas, 0, 0);
    return out;
}
