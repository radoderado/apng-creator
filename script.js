// DOM要素の取得
const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');
const fileInput = document.getElementById('file-input');
const createBtn = document.getElementById('create-btn');
const previewDiv = document.getElementById('preview-area');
const previewImg = document.getElementById('preview-img');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');
const apngProgressArea = document.getElementById('apng-progress-area');
const apngProgress = document.getElementById('apng-progress');
const apngProgressText = document.getElementById('apng-progress-text');

const videoDropZone = document.getElementById('video-drop-zone');
const videoInput = document.getElementById('video-input');
const convertBtn = document.getElementById('convert-btn');
const videoPreview = document.getElementById('video-preview');
const videoPreviewArea = document.getElementById('video-preview-area');
const videoDownloadLink = document.getElementById('video-download-link');
const videoResetBtn = document.getElementById('video-reset-btn');
const videoProgressArea = document.getElementById('video-progress-area');
const videoProgress = document.getElementById('video-progress');
const videoProgressText = document.getElementById('video-progress-text');

// ワーカー
let worker = null;
let pngFiles = [];

// FFmpegのセットアップ
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg;


// ドラッグ＆ドロップのイベントリスナー
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// ファイル入力のイベントリスナー
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// ファイル処理関数
function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/png'));
    if (newFiles.length === 0) {
        alert('PNGファイルを選択してください。');
        return;
    }

    pngFiles = [...pngFiles, ...newFiles].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    updateFileList();
    createBtn.disabled = false;
}

function updateFileList() {
    fileList.innerHTML = '';
    pngFiles.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.name;
        fileList.appendChild(li);
    });
}

// APNG作成関数
async function createAPNG() {
    if (pngFiles.length === 0) {
        alert('APNGに変換するファイルがありません。');
        return;
    }
    createBtn.disabled = true;
    createBtn.textContent = '作成中...';
    apngProgressArea.style.display = 'block';
    apngProgress.value = 0;
    apngProgressText.textContent = '0%';

    try {
        if (!worker) {
            worker = new Worker('apng.worker.js');
        }

        const fps = parseInt(document.getElementById('fps-input').value) || 30;
        const delay = Math.round(1000 / fps);

        const fileBuffers = await Promise.all(pngFiles.map(file => file.arrayBuffer()));

        worker.postMessage({
            files: fileBuffers,
            delay: delay
        });

        worker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'progress') {
                const percent = Math.round(data * 100);
                apngProgress.value = percent;
                apngProgressText.textContent = `${percent}%`;
            } else if (type === 'done') {
                const blob = data;
                downloadLink.href = URL.createObjectURL(blob);
                previewImg.src = downloadLink.href;
                previewDiv.style.display = 'block';
                downloadLink.style.display = 'inline-block';
                apngProgressText.textContent = '完了';
            } else if (type === 'error') {
                console.error('APNG作成エラー:', data);
                alert('APNGの作成に失敗しました: ' + data);
                apngProgressArea.style.display = 'none';
            }
        };
    } catch (error) {
        console.error('APNG作成処理エラー:', error);
        alert('APNGの作成に失敗しました。エラー: ' + error.message);
        apngProgressArea.style.display = 'none';
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'APNGを作成';
    }
}

// リセットボタンのイベントリスナー
resetBtn.addEventListener('click', () => {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    pngFiles = [];
    fileList.innerHTML = '';
    fileInput.value = '';
    if (previewImg.src) {
        URL.revokeObjectURL(previewImg.src);
    }
    previewImg.src = '';
    previewDiv.style.display = 'none';
    downloadLink.href = '#';
    downloadLink.style.display = 'none';
    createBtn.disabled = true;
    apngProgressArea.style.display = 'none';
});

createBtn.addEventListener('click', createAPNG);

// --- Video Converter ---

function handleVideoFile(file) {
    if (!file || !file.type.startsWith('video/')) {
        alert('ビデオファイルを選択してください。');
        return;
    }
    if (file.size > 50 * 1024 * 1024) {
        alert('ファイルサイズは50MBまでです。');
        return;
    }
    videoPreview.src = URL.createObjectURL(file);
    videoPreviewArea.style.display = 'block';
    convertBtn.disabled = false;

    const oldInfo = videoPreviewArea.querySelector('p');
    if (oldInfo) oldInfo.remove();

    const videoInfo = document.createElement('p');
    videoInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
    videoPreviewArea.insertBefore(videoInfo, videoPreview);
}

videoInput.addEventListener('change', (e) => handleVideoFile(e.target.files[0]));
videoDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    videoDropZone.classList.add('dragover');
});
videoDropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    videoDropZone.classList.remove('dragover');
});
videoDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    videoDropZone.classList.remove('dragover');
    handleVideoFile(e.dataTransfer.files[0]);
});

convertBtn.addEventListener('click', async () => {
    const videoFile = videoInput.files[0];
    if (!videoFile) {
        alert('ビデオファイルが選択されていません。');
        return;
    }

    convertBtn.disabled = true;
    convertBtn.textContent = '変換中...';
    videoProgressArea.style.display = 'block';
    videoProgress.value = 0;
    videoProgressText.textContent = '0%';

    try {
        if (!ffmpeg || !ffmpeg.isLoaded()) {
             ffmpeg = createFFmpeg({
                log: true,
                corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
            });
            ffmpeg.setProgress(({ ratio }) => {
                const percent = Math.round(ratio * 100);
                videoProgress.value = percent;
                videoProgressText.textContent = `${percent}%`;
            });
            await ffmpeg.load();
        }

        ffmpeg.FS('writeFile', videoFile.name, await fetchFile(videoFile));

        await ffmpeg.run('-i', videoFile.name, '-c:v', 'libvpx-vp9', '-c:a', 'libopus', 'output.webm');

        const data = ffmpeg.FS('readFile', 'output.webm');

        const blob = new Blob([data.buffer], { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        videoDownloadLink.href = url;
        videoDownloadLink.download = videoFile.name.replace(/\.[^/.]+$/, '') + '.webm';
        videoDownloadLink.style.display = 'inline-block';
        videoPreview.src = url;
        videoProgressText.textContent = '完了';

        alert('変換が完了しました！');
    } catch (error) {
        console.error('ビデオ変換エラー:', error);
        alert('ビデオの変換に失敗しました。');
        videoProgressArea.style.display = 'none';
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = 'WebMに変換';
    }
});

videoResetBtn.addEventListener('click', () => {
    videoInput.value = '';
    if (videoPreview.src) {
        URL.revokeObjectURL(videoPreview.src);
    }
    videoPreview.src = '';
    videoPreviewArea.style.display = 'none';
    videoDownloadLink.href = '#';
    videoDownloadLink.style.display = 'none';
    convertBtn.disabled = true;
    videoProgressArea.style.display = 'none';
});
