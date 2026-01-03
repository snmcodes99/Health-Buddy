const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const { ExternalServiceError } = require('../utils/errors');

class OCRService {
  constructor() {
    this.qrReader = null;
  }

  getQrReader() {
    if (!this.qrReader) {
      const { BrowserQRCodeReader } = require('@zxing/library');
      this.qrReader = new BrowserQRCodeReader();
    }
    return this.qrReader;
  }

  async preprocessImage(buffer) {
    return sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .normalize()
      .sharpen()
      .toBuffer();
  }

  async decodeQRCode(buffer) {
    try {
      const { loadImage } = require('canvas');

      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      const img = await loadImage(dataUrl);
      const reader = this.getQrReader();
      const result = await reader.decodeFromImageElement(img);

      return {
        text: result.getText(),
        format: result.getBarcodeFormat()
      };
    } catch {
      return null;
    }
  }

  async runOCR(buffer) {
    try {
      const processed = await this.preprocessImage(buffer);
      const result = await Tesseract.recognize(processed, 'eng');

      return {
        text: result.data.text || '',
        confidence: Math.round(result.data.confidence || 0)
      };
    } catch {
      return { text: '', confidence: 0 };
    }
  }

  async processImage(buffer) {
    try {
      // 1️⃣ Try QR
      const qrResult = await this.decodeQRCode(buffer);
      if (qrResult?.text) {
        return {
          text: qrResult.text,
          type: 'qr',
          confidence: 100,
          base64Image: null
        };
      }

      // 2️⃣ Try OCR locally
      const ocr = await this.runOCR(buffer);
      if (ocr.text && ocr.text.length > 10) {
        return {
          text: ocr.text,
          type: 'ocr',
          confidence: ocr.confidence,
          base64Image: null
        };
      }

      // 3️⃣ Fallback to base64 for Vision if needed later
      const base64Image = buffer.toString('base64');
      return {
        text: '',
        type: 'ocr',
        confidence: 0,
        base64Image
      };

    } catch (error) {
      throw new ExternalServiceError(`Image processing failed: ${error.message}`);
    }
  }
}

module.exports = new OCRService();
