// FFmpeg.wasmの設定
let ffmpeg = null;

// FFmpegの初期化
async function initFFmpeg() {
    if (!ffmpeg) {
        ffmpeg = FFmpeg.createFFmpeg({
            corePath: 'https://unpkg.com/@ffmpeg/core-dist/ffmpeg-core.js',
            log: true
        });
        await ffmpeg.load();
    }
}

// MP4をWebMに変換する関数
async function convertToWebM(mp4File) {
    try {
        // FFmpegの初期化
        await initFFmpeg();

        // ファイルを読み込む
        await ffmpeg.writeFile('input.mp4', await mp4File.arrayBuffer());

        // 変換コマンドを実行
        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-c:v', 'libvpx-vp9',
            '-b:v', '1M',
            '-c:a', 'libopus',
            'output.webm'
        ]);

        // 変換されたファイルを読み込む
        const data = await ffmpeg.readFile('output.webm');
        return new Blob([data.buffer], { type: 'video/webm' });
    } catch (error) {
        console.error('変換エラー:', error);
        throw error;
    }
}
