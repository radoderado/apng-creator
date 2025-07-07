importScripts('pako.js', 'upng.js');

self.onmessage = async (e) => {
    const { files, delay } = e.data;

    try {
        if (!files || files.length === 0) {
            self.postMessage({ type: 'error', data: '画像ファイルがありません。' });
            return;
        }

        const rgbaFrames = [];
        let width, height;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const arrayBuffer = file; // This is already an ArrayBuffer
            const img = UPNG.decode(arrayBuffer);
            
            if (width === undefined) {
                width = img.width;
                height = img.height;
            } else if (img.width !== width || img.height !== height) {
                self.postMessage({ type: 'error', data: 'すべてのPNGのサイズが同じである必要があります。' });
                return;
            }
            
            rgbaFrames.push(UPNG.toRGBA8(img)[0]);
            // Post progress update
            self.postMessage({ type: 'progress', data: (i + 1) / files.length });
        }

        const delays = Array(rgbaFrames.length).fill(delay);

        const apngBuffer = UPNG.encode(
            rgbaFrames,
            width,
            height,
            0, 
            delays
        );

        const blob = new Blob([apngBuffer], { type: 'image/apng' });
        self.postMessage({ type: 'done', data: blob });

    } catch (err) {
        console.error("Worker error:", err);
        self.postMessage({ type: 'error', data: `APNGの作成中にエラーが発生しました: ${err.message}` });
    }
};