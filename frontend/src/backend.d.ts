import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export enum EnhancementMode {
    anime = "anime",
    standard = "standard"
}
export interface backendInterface {
    finalizeUpload(sessionId: string, mode: EnhancementMode): Promise<{
        ok?: {
            enhancedImage: Uint8Array;
            imageId: string;
        };
        err: string;
    }>;
    getAllImageIds(): Promise<Array<string>>;
    getImageRaw(imageId: string): Promise<Uint8Array>;
    initUpload(totalChunks: bigint, fileType: string): Promise<string>;
    uploadChunk(sessionId: string, chunkIndex: bigint, data: Uint8Array): Promise<void>;
}
