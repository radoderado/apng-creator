// pako.js と UPNG.js ライブラリをワーカーにインポートします
importScripts('pako.js', 'upng.js');

self.onmessage = (e) => {
    const { fileBuffers, delay } = e.data;

    try {
        if (!fileBuffers || fileBuffers.length === 0) {
            self.postMessage({ error: '画像ファイルがありません。' });
            return;
        }

        // 1. すべてのPNGをデコードし、RGBA8形式のピクセルデータに変換します。
        //    同時に、すべての画像のサイズが同じであることを確認します。
        const rgbaFrames = [];
        let width, height;

        for (const buffer of fileBuffers) {
            const img = UPNG.decode(buffer);
            if (width === undefined) {
                width = img.width;
                height = img.height;
            } else if (img.width !== width || img.height !== height) {
                self.postMessage({ error: 'すべてのPNGのサイズが同じである必要があります。' });
                return;
            }
            // UPNG.toRGBA8はフレームの配列を返すので、最初の要素（[0]）を取得します。
            rgbaFrames.push(UPNG.toRGBA8(img)[0]);
        }

        // 2. フレームごとの遅延時間の配列を作成します。
        const delays = Array(rgbaFrames.length).fill(delay);

        // 3. RGBAピクセルデータ、サイズ、遅延時間を使ってAPNGをエンコードします。
        //    cnumを0に設定すると、RGBAデータが期待されます。
        const apngBuffer = UPNG.encode(
            rgbaFrames,
            width,
            height,
            0, // cnum = 0 for RGBA
            delays
        );

        // 4. 結果をメインスレッドに送り返します。
        self.postMessage({ apngBuffer: apngBuffer }, [apngBuffer]);

    } catch (err) {
        console.error("Worker error:", err);
        self.postMessage({ error: `APNGの作成中にエラーが発生しました: ${err.message}` });
    }
};
