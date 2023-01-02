"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const BINARY_EXECUTABLE = "yt-dlp";
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
            command.push("-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b");
        }
        else {
            command.push("-f", "bv*+ba/b");
        }
        return this.execute(command);
    }
    async downloadVideo(videoId, where, wantMPEG = false) {
        return this.downloadVideoPlaylist(videoId, where, wantMPEG, 1);
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
        return this.downloadAudioPlaylist(videoId, where, wantMPEG, 1);
    }
    async execute(command) {
        return new Promise((resolve, _) => {
            const infos = [];
            const process = (0, child_process_1.spawn)(BINARY_EXECUTABLE, command);
            process.stdout.on("data", (chunk) => {
                const parts = chunk.toString("ascii").split("\n");
                infos.push({
                    id: parts[0],
                    title: parts[1],
                    ext: parts[2],
                });
            });
            process.stderr.on("data", (chunk) => {
                console.log(chunk.toString("utf-8"));
            });
            process.on("exit", (_) => resolve(infos));
        });
    }
}
exports.default = YtDlpHelper;
