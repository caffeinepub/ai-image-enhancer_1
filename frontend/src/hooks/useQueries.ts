import { useMutation } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useRef } from 'react';
import { EnhancementMode } from '../backend';

const CHUNK_SIZE = 1_572_864; // 1.5 MB per chunk

/**
 * Split a Uint8Array into chunks of at most `chunkSize` bytes.
 */
function splitIntoChunks(data: Uint8Array, chunkSize: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    let offset = 0;
    while (offset < data.length) {
        chunks.push(data.slice(offset, offset + chunkSize));
        offset += chunkSize;
    }
    return chunks;
}

/**
 * Create a blob URL from raw image bytes.
 * Copies bytes into a fresh ArrayBuffer to satisfy the BlobPart type constraint.
 */
function createBlobUrlFromBytes(bytes: Uint8Array, mimeType: string): string {
    // Copy into a plain ArrayBuffer to avoid SharedArrayBuffer type issues
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
}

/**
 * Detect MIME type from file magic bytes.
 */
function detectMimeType(bytes: Uint8Array): string {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'image/jpeg';
    }
    if (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
    ) {
        return 'image/png';
    }
    return 'image/png';
}

export interface UploadProgress {
    phase: 'uploading' | 'enhancing';
    /** 0–1 fraction of chunks uploaded (only meaningful during 'uploading' phase) */
    fraction: number;
}

export function useProcessImage() {
    const { actor } = useActor();
    // Mutable ref so we can update progress without re-rendering the hook itself
    const progressRef = useRef<UploadProgress>({ phase: 'uploading', fraction: 0 });
    // Callback ref so callers can subscribe to progress updates
    const onProgressRef = useRef<((p: UploadProgress) => void) | null>(null);
    // Track the last enhanced blob URL so we can revoke it on the next run
    const prevEnhancedUrlRef = useRef<string | null>(null);

    const mutation = useMutation({
        mutationFn: async ({
            imageBytes,
            fileType,
            enhancementMode,
            onProgress,
        }: {
            imageBytes: Uint8Array;
            fileType: string;
            enhancementMode: EnhancementMode;
            onProgress?: (p: UploadProgress) => void;
        }): Promise<{ imageId: string; enhancedUrl: string }> => {
            if (!actor) throw new Error('Backend not available');

            // Revoke the previous enhanced blob URL to free memory
            if (prevEnhancedUrlRef.current) {
                URL.revokeObjectURL(prevEnhancedUrlRef.current);
                prevEnhancedUrlRef.current = null;
            }

            onProgressRef.current = onProgress ?? null;

            const reportProgress = (p: UploadProgress) => {
                progressRef.current = p;
                onProgressRef.current?.(p);
            };

            // Step 1: Split raw file bytes into ≤1.5MB chunks
            const chunks = splitIntoChunks(imageBytes, CHUNK_SIZE);
            const totalChunks = chunks.length;

            reportProgress({ phase: 'uploading', fraction: 0 });

            // Step 2: Initialise upload session on the backend
            const sessionId = await actor.initUpload(BigInt(totalChunks), fileType);

            // Step 3: Upload each chunk sequentially
            for (let i = 0; i < totalChunks; i++) {
                await actor.uploadChunk(sessionId, BigInt(i), chunks[i]);
                reportProgress({ phase: 'uploading', fraction: (i + 1) / totalChunks });
            }

            // Step 4: Transition to enhancing phase
            reportProgress({ phase: 'enhancing', fraction: 1 });

            // Step 5: Finalize upload — backend reassembles and enhances with the selected mode
            const result = await actor.finalizeUpload(sessionId, enhancementMode);

            if (!result.ok) {
                throw new Error(result.err || 'Enhancement failed on the backend');
            }

            const { imageId, enhancedImage } = result.ok;

            // Step 6: Validate we got non-empty bytes back
            const enhancedBytes = new Uint8Array(enhancedImage);
            if (enhancedBytes.length === 0) {
                throw new Error('Backend returned empty image data');
            }

            // Step 7: Create a blob URL directly from the returned bytes.
            // Detect MIME type from magic bytes; fall back to the original file type.
            const detectedMime = detectMimeType(enhancedBytes);
            const mimeType = detectedMime !== 'image/png' ? detectedMime : fileType;
            const enhancedUrl = createBlobUrlFromBytes(enhancedBytes, mimeType);

            // Track for cleanup on next run
            prevEnhancedUrlRef.current = enhancedUrl;

            return { imageId, enhancedUrl };
        },
    });

    return mutation;
}
