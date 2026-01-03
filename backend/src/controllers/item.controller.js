const itemService = require('../services/item.service');
const ocrService = require('../services/ocr.service');
const geminiService = require('../services/gemini.service');

class ItemController {
async createItem(req, res, next) {
  try {
    const { sessionId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const processedImage = await ocrService.processImage(imageBuffer);

    let extractedText = processedImage.text || '';
    let ingredients = [];
    let confidence = processedImage.confidence || 0;

    try {
      // 1️⃣ QR has highest priority
      if (processedImage.type === 'qr' && extractedText) {
        ingredients = await geminiService.parseIngredients(extractedText);

      // 2️⃣ Use OCR text if available
      } else if (extractedText && extractedText.length > 10) {
        ingredients = await geminiService.parseIngredients(extractedText);

      // 3️⃣ If no text but image exists → try vision
      } else if (processedImage.base64Image) {
        const visionResult = await geminiService.extractTextFromImage(
          processedImage.base64Image,
          mimeType
        );

        extractedText = visionResult.text || '';
        confidence = visionResult.confidence || 0;

        if (extractedText.length > 10) {
          ingredients = await geminiService.parseIngredients(extractedText);
        }
      }

    } catch (aiError) {
      console.warn('AI extraction failed, continuing without it:', aiError.message);
    }

    // 🛡 Safety normalize
    if (!Array.isArray(ingredients)) ingredients = [];
    ingredients = ingredients.map(i => String(i).trim()).filter(Boolean);

    // 🧠 Fallback: derive ingredients from raw text if parsing failed
    if (!ingredients.length && extractedText) {
      ingredients = extractedText
        .split(/,|\n/)
        .map(t => t.trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    const item = await itemService.createItem(
      sessionId,
      ingredients,
      extractedText,
      processedImage.type
    );

    // 🏷 Generate a meaningful display name
    const displayName =
      ingredients.length > 0
        ? ingredients.slice(0, 2).join(', ')
        : extractedText?.split(/\s+/).slice(0, 3).join(' ')
          || req.file.originalname.replace(/\.[^/.]+$/, '')
          || 'Uploaded Product';

    res.status(201).json({
      success: true,
      data: {
        itemId: item._id,
        sessionId: item.sessionId,
        ingredients: item.ingredients,
        ingredientCount: item.ingredients.length,
        displayName,
        imageType: item.imageType,
        rawText: extractedText.substring(0, 500),
        confidence,
        createdAt: item.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
}


  async getItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const item = await itemService.getItem(itemId);

      res.status(200).json({
        success: true,
        data: {
          itemId: item._id,
          sessionId: item.sessionId,
          ingredients: item.ingredients,
          messageCount: item.messages.length,
          imageType: item.imageType,
          createdAt: item.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getItemsBySession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const items = await itemService.getItemsBySession(sessionId);

      res.status(200).json({
        success: true,
        data: {
          count: items.length,
          items: items.map(item => ({
            itemId: item._id,
            ingredients: item.ingredients,
            ingredientCount: item.ingredients.length,
            messageCount: item.messages.length,
            imageType: item.imageType,
            createdAt: item.createdAt
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemController();
