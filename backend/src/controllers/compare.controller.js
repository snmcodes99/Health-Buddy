const compareService = require('../services/compare.service');

class CompareController {
  async compare(req, res, next) {
    try {
      const { itemIds, sessionId } = req.body;

      const comparison = await compareService.compareItems(itemIds, sessionId);

      res.status(200).json({ success: true, data: comparison });
    } catch (error) {
      next(error);
    }
  }

  async getItemsForComparison(req, res, next) {
    try {
      const { itemIds, sessionId } = req.body;

      const items = await compareService.getItemsForComparison(itemIds, sessionId);

      res.status(200).json({
        success: true,
        data: {
          count: items.length,
          items
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompareController();
