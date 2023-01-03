export type VideoInfo = {
    readonly id: string;
    readonly title?: string;
    readonly ext?: string;
    readonly playlist?: string;
    error?: string;
};
export declare class YtDlpError extends Error {
}
export declare class YtDlpHelper {
    downloadVideoPlaylist(playlistId: string, where: string, wantMPEG?: boolean, limit?: number): Promise<VideoInfo[]>;
    downloadVideo(videoId: string, where: string, wantMPEG?: boolean): Promise<VideoInfo>;
    downloadAudioPlaylist(playlistId: string, where: string, wantMPEG?: boolean, limit?: number): Promise<VideoInfo[]>;
    downloadAudio(videoId: string, where: string, wantMPEG?: boolean): Promise<VideoInfo>;
    private execute;
}