document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const createBtn = document.getElementById('create-btn');
    const fpsInput = document.getElementById('fps-input');
    const previewDiv = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-img');
    const downloadLink = document.getElementById('download-link');
    const statusDiv = document.getElementById('status');

    let pngFiles = [];
    let worker;

    function initializeWorker() {
        worker = new Worker('apng.worker.js');

        worker.onmessage = (e) => {
            // Workerからのメッセージを処理します
            const { apngBuffer, error } = e.data;
            createBtn.disabled = false; // ボタンを再度有効にします

            if (error) {
                // エラーが発生した場合
                statusDiv.textContent = `エラー: ${error}`;
                console.error('An error occurred in the worker:', error);
                previewDiv.style.display = 'none'; // プレビューを隠します
            } else if (apngBuffer) {
                // 成功した場合
                const blob = new Blob([apngBuffer], { type: 'image/png' });
                const url = URL.createObjectURL(blob);

                previewImg.src = url;
                downloadLink.href = url;
                downloadLink.download = 'animation.png'; // ダウンロードファイル名を設定します
                previewDiv.style.display = 'block'; // プレビューを表示します
                statusDiv.textContent = 'APNGが作成されました！プレビューを確認し、ダウンロードしてください。';
            } else {
                // 予期せぬデータの場合
                statusDiv.textContent = 'ワーカーから予期しないデータを受信しました。';
                previewDiv.style.display = 'none';
            }
        };

        worker.onerror = (e) => {
            console.error('An error occurred in the worker:', e);
            alert('ワーカーの初期化中に致命的なエラーが発生しました。');
            createBtn.disabled = false;
            createBtn.textContent = 'APNGを作成';
        };
    }

    // --- Event Listeners ---
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    createBtn.addEventListener('click', createAPNG);

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        // ファイルリストのクリア
        pngFiles = [];
        fileList.innerHTML = '';
        
        // プレビューのクリア
        previewImg.src = '';
        previewDiv.style.display = 'none';
        
        // ダウンロードリンクのクリア
        downloadLink.href = '#';
        downloadLink.download = '';
        
        // ボタンのリセット
        createBtn.disabled = true;
        createBtn.textContent = 'APNGを作成';
        
        // ステータスメッセージのクリア
        statusDiv.textContent = '';
    });

    // --- Functions ---
    function handleFiles(files) {
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        const newFiles = Array.from(files)
            .filter(file => file.type === 'image/png')
            .filter(file => {
                if (file.size > MAX_FILE_SIZE) {
                    alert(`ファイルサイズが大きすぎます。${file.name}は${Math.round(file.size / 1024 / 1024)}MBで、最大50MBを超過しています。`);
                    return false;
                }
                return true;
            });

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

    async function createAPNG() {
        if (pngFiles.length === 0) {
            alert('APNGに変換するファイルがありません。');
            return;
        }

        createBtn.disabled = true;
        createBtn.textContent = '画像読み込み中...';

        try {
            const fileBuffers = await Promise.all(pngFiles.map(file => file.arrayBuffer()));
            
            createBtn.textContent = 'APNGを作成中... (時間がかかる場合があります)';
            const delay = Math.round(1000 / fpsInput.value) || 33;  // fpsからミリ秒に変換

            // ワーカーに処理を依頼します
            worker.postMessage({ fileBuffers, delay }, fileBuffers);

            // メモリリーク対策：ファイルデータのクリア
            fileBuffers.forEach(buffer => {
                if (buffer instanceof ArrayBuffer) {
                    buffer.byteLength = 0;
                }
            });

        } catch (error) {
            console.error('ファイル読み込み中にエラー:', error);
            alert('ファイルの読み込み中にエラーが発生しました。');
            createBtn.disabled = false;
            createBtn.textContent = 'APNGを作成';
        }
    }

    // Initialize the worker when the DOM is ready
    initializeWorker();
});
