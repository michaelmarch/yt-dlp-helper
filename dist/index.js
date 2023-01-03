"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YtDlpError = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const BINARY_EXECUTABLE = "yt-dlp";
const videoErrorPattern = /ERROR:[ ]+(?:.*?)[ ]+(\w{11,}?):[ ]+(.*)/;
class YtDlpError extends Error {
}
exports.YtDlpError = YtDlpError;
class YtDlpHelper {
    async downloadVideoPlaylist(playlistId, where, wantMPEG = false, limit = 0) {
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
            (0, path_1.join)(where, "%(id)s.%(ext)s"),
        ];
        if (limit > 0) {
            command.push("--max-downloads", limit.toString());
        }
        if (wantMPEG) {
            // TODO: with verbose output (and maybe with some time function) check the impact of remuxing when the file is mp4 and when it's not
            //command.push("--remux-video", "mp4");
            command.push("-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b");
        }
        else {
            command.push("-f", "bv*+ba/b");
        }
        return this.execute(command);
    }
    async downloadVideo(videoId, where, wantMPEG = false) {
        let info = await this.downloadVideoPlaylist(videoId, where, wantMPEG, 1);
        return info[0];
    }
    async downloadAudioPlaylist(playlistId, where, wantMPEG = false, limit = 0) {
        const command = [
            playlistId,
            "--no-simulate",
            "--no-progress",
            "--restrict-filenames",
            "-O",
            "%(id)s\n%(title)s\n%(ext)s",
            "-o",
            (0, path_1.join)(where, "%(id)s.%(ext)s"),
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
    async downloadAudio(videoId, where, wantMPEG = false) {
        let info = await this.downloadAudioPlaylist(videoId, where, wantMPEG, 1);
        return info[0];
    }
    async execute(command) {
        return new Promise((resolve, reject) => {
            const infos = new Map();
            const process = (0, child_process_1.spawn)(BINARY_EXECUTABLE, command);
            process.stdout.on("data", (chunk) => {
                const parts = chunk.toString("ascii").split("\n");
                infos.set(parts[0], {
                    id: parts[0],
                    title: parts[1],
                    ext: parts[2],
                });
            });
            process.stderr.on("data", (chunk) => {
                const error = chunk.toString("utf-8");
                console.log(error);
                const match = error.match(videoErrorPattern);
                if (match != null) {
                    const [, id, errorMessage] = match;
                    const info = infos.get(id);
                    if (info) {
                        info.error = errorMessage;
                    }
                    else {
                        infos.set(id, {
                            id: id,
                            error: errorMessage,
                        });
                    }
                }
                else {
                    reject(new YtDlpError(error));
                }
            });
            process.on("exit", (_) => {
                resolve(Array.from(infos.values()));
            });
        });
    }
}
exports.default = YtDlpHelper;
