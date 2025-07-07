// FFmpegの初期化
let ffmpeg = null;

// FFmpegの初期化
async function initFFmpeg() {
    if (!window.FFmpeg) {
        console.error('FFmpegライブラリが読み込まれていません');
        return null;
    }
    
    if (!ffmpeg) {
        ffmpeg = window.FFmpeg.createFFmpeg({
            corePath: 'https://unpkg.com/@ffmpeg/core-dist/ffmpeg-core.js',
            log: true
        });
        try {
            await ffmpeg.load();
        } catch (error) {
            console.error('FFmpegの初期化に失敗しました:', error);
            throw error;
        }
    }
    return ffmpeg;
}

// MP4をWebMに変換する関数
async function convertToWebM(mp4File) {
    try {
        // FFmpegの初期化
        const ffmpegInstance = await initFFmpeg();
        if (!ffmpegInstance) {
            throw new Error('FFmpegの初期化に失敗しました');
        }

        // ファイルを読み込む
        await ffmpegInstance.writeFile('input.mp4', await mp4File.arrayBuffer());

        // 変換コマンドを実行
        await ffmpegInstance.exec([
            '-i', 'input.mp4',
            '-c:v', 'libvpx-vp9',
            '-b:v', '1M',
            '-c:a', 'libopus',
            'output.webm'
        ]);

        // 変換されたファイルを読み込む
        const data = await ffmpegInstance.readFile('output.webm');
        return new Blob([data.buffer], { type: 'video/webm' });
    } catch (error) {
        console.error('変換エラー:', error);
        throw error;
    }
}
