import { spawn } from "child_process";
import { join } from "path";

const BINARY_EXECUTABLE = "yt-dlp";

const videoErrorPattern = /ERROR:[ ]+(?:.*?)[ ]+(\w{11,}?):[ ]+(.*)/;

export type VideoInfo = {
  readonly id: string;
  readonly title?: string;
  readonly ext?: string;
  error?: string;
};

export class YtDlpError extends Error {}

export class YtDlpHelper {
  public async downloadVideoPlaylist(
    playlistId: string,
    where: string,
    wantMPEG: boolean = false,
    limit: number = 0
  ): Promise<VideoInfo[]> {
    const command = [
      playlistId,
      "--no-warnings",
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
      // TODO: with verbose output (and maybe with some time function) check the impact of remuxing when the file is mp4 and when it's not
      //command.push("--remux-video", "mp4");
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
  ): Promise<VideoInfo> {
    let info = await this.downloadVideoPlaylist(videoId, where, wantMPEG, 1);

    return info[0];
  }

  public async downloadAudioPlaylist(
    playlistId: string,
    where: string,
    wantMPEG: boolean = false,
    limit: number = 0
  ): Promise<VideoInfo[]> {
    const command = [
      playlistId,
      "--no-warnings",
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
  ): Promise<VideoInfo> {
    let info = await this.downloadAudioPlaylist(videoId, where, wantMPEG, 1);

    return info[0];
  }

  private async execute(command: string[]): Promise<VideoInfo[]> {
    return new Promise<VideoInfo[]>((resolve, reject) => {
      const infos = new Map<string, VideoInfo>();
      const process = spawn(BINARY_EXECUTABLE, command);

      process.stdout.on("data", (chunk: Buffer) => {
        const parts = chunk.toString("ascii").split("\n");
        infos.set(parts[0], {
          id: parts[0],
          title: parts[1],
          ext: parts[2],
        });
      });

      process.stderr.on("data", (chunk: Buffer) => {
        const error = chunk.toString("utf-8");
        console.log(error);
        const match = error.match(videoErrorPattern);
        if (match != null) {
          const [, id, errorMessage] = match;
          const info = infos.get(id);

          if (info) {
            info.error = errorMessage;
          } else {
            infos.set(id, {
              id: id,
              error: errorMessage,
            });
          }
        } else {
          reject(new YtDlpError(error));
        }
      });

      process.on("exit", (_) => {
        resolve(Array.from<VideoInfo>(infos.values()));
      });
    });
  }
}
