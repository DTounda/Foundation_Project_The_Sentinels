const OCR_URL = 'https://api.ocr.space/parse/image';

/**
 * Sends a photo to OCR.space and returns the printed text.
 * fetchFn is passed in so tests can use a fake instead of calling the real service.
 */
function createOcrService({ apiKey, fetchFn = fetch }) {
  return {
    /** Returns the text on the photo, or '' when nothing could be read. */
    async readText(base64Jpeg) {
      const form = new FormData();
      form.append('base64Image', `data:image/jpeg;base64,${base64Jpeg}`);
      form.append('language', 'eng');
      form.append('OCREngine', '2');
      form.append('scale', 'true');

      const res = await fetchFn(OCR_URL, {
        method: 'POST',
        headers: { apikey: apiKey },
        body: form,
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`OCR service answered ${res.status}`);

      const data = await res.json();
      if (data.IsErroredOnProcessing) {
        throw new Error(`OCR failed: ${[].concat(data.ErrorMessage).join(' ')}`);
      }
      return (data.ParsedResults || [])
        .map((r) => r.ParsedText || '')
        .join('\n')
        .trim();
    },
  };
}

module.exports = { createOcrService };
