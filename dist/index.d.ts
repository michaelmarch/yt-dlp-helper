export interface VideoInfo {
    id: string;
    title: string;
    ext: string;
}
export default class YtDlpHelper {
    downloadVideoPlaylist(playlistId: string, where: string, wantMPEG?: boolean, limit?: number): Promise<VideoInfo[]>;
    downloadVideo(videoId: string, where: string, wantMPEG?: boolean): Promise<VideoInfo[]>;
    downloadAudioPlaylist(playlistId: string, where: string, wantMPEG?: boolean, limit?: number): Promise<VideoInfo[]>;
    downloadAudio(videoId: string, where: string, wantMPEG?: boolean): Promise<VideoInfo[]>;
    private execute;
}
