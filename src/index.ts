import { spawn } from "child_process";
import { join } from "path";

const BINARY_EXECUTABLE = "yt-dlp";

export interface VideoInfo {
  id: string;
  title: string;
  ext: string;
}

export default class YtDlpHelper {
  public async downloadVideoPlaylist(
    playlistId: string,
    where: string,
    wantMPEG: boolean = false,
    limit: number = 0
  ): Promise<VideoInfo[]> {
    const command = [
      playlistId,
      "--no-simulate",
      "--no-progress",
      "--restrict-filenames",
      "--format-sort-force",
      "-S",
      "res:1080",
      "-O",
      "%(id)s\n%(title)s\n%(ext)s",
      "-o",
      join(where, "%(id)s.%(ext)s"),
    ];

    if (limit > 0) {
      command.push("--max-downloads", limit.toString());
    }

    if (wantMPEG) {
      command.push("-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b");
    } else {
      command.push("-f", "bv*+ba/b");
    }

    return this.execute(command);
  }

  public async downloadVideo(
    videoId: string,
    where: string,
    wantMPEG: boolean = false
  ): Promise<VideoInfo[]> {
    return this.downloadVideoPlaylist(videoId, where, wantMPEG, 1);
  }

  public async downloadAudioPlaylist(
    playlistId: string,
    where: string,
    wantMPEG: boolean = false,
    limit: number = 0
  ): Promise<VideoInfo[]> {
    const command = [
      playlistId,
      "--no-simulate",
      "--no-progress",
      "--restrict-filenames",
      "-O",
      "%(id)s\n%(title)s\n%(ext)s",
      "-o",
      join(where, "%(id)s.%(ext)s"),
      "-f",
      "ba",
    ];

    if (limit > 0) {
      command.push("--max-downloads", limit.toString());
    }

    if (wantMPEG) {
      command.push("-x", "--audio-format", "mp3");
    }

    return this.execute(command);
  }

  public async downloadAudio(
    videoId: string,
    where: string,
    wantMPEG: boolean = false
  ): Promise<VideoInfo[]> {
    return this.downloadAudioPlaylist(videoId, where, wantMPEG, 1);
  }

  private async execute(command: string[]): Promise<VideoInfo[]> {
    return new Promise<VideoInfo[]>((resolve, _) => {
      const infos: VideoInfo[] = [];

      const process = spawn(BINARY_EXECUTABLE, command);

      process.stdout.on("data", (chunk: Buffer) => {
        const parts = chunk.toString("ascii").split("\n");
        infos.push({
          id: parts[0],
          title: parts[1],
          ext: parts[2],
        });
      });

      process.stderr.on("data", (chunk: Buffer) => {
        console.log(chunk.toString("utf-8"));
      });

      process.on("exit", (_) => resolve(infos));
    });
  }
}
