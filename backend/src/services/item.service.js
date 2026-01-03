const Item = require('../models/Item.model');
const Session = require('../models/Session.model');
const { NotFoundError, ValidationError } = require('../utils/errors');

class ItemService {

  normalizeId(id, name = 'ID') {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new ValidationError(`Invalid ${name}`);
    }
    return id.trim();
  }

  normalizeIngredients(ingredients) {
    if (!Array.isArray(ingredients)) return [];
    return ingredients
      .map(i => String(i).trim())
      .filter(Boolean);
  }

  async createItem(sessionId, ingredients, rawText = '', imageType = 'unknown') {
    sessionId = this.normalizeId(sessionId, 'session ID');

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found or expired');
    }

    const item = new Item({
      sessionId,
      ingredients: this.normalizeIngredients(ingredients),
      rawText: rawText || '',
      imageType
    });

    await item.save();

    session.activeItemId = item._id;
    await session.updateActivity();

    return item;
  }

  async getItem(itemId) {
    itemId = this.normalizeId(itemId, 'item ID');

    const item = await Item.findById(itemId);
    if (!item) {
      throw new NotFoundError('Item not found');
    }

    return item;
  }

  async getItemWithSessionCheck(itemId, sessionId) {
    itemId = this.normalizeId(itemId, 'item ID');
    sessionId = this.normalizeId(sessionId, 'session ID');

    const item = await this.getItem(itemId);

    if (item.sessionId !== sessionId) {
      throw new ValidationError('Item does not belong to this session');
    }

    return item;
  }

  async getItemsBySession(sessionId) {
    sessionId = this.normalizeId(sessionId, 'session ID');

    return Item.find({ sessionId }).sort({ createdAt: -1 });
  }

  async addMessageToItem(itemId, role, content) {
    const item = await this.getItem(itemId);
    item.addMessage(role, content);
    await item.save();
    return item;
  }

  async deleteItem(itemId) {
    itemId = this.normalizeId(itemId, 'item ID');

    const result = await Item.findByIdAndDelete(itemId);
    if (!result) {
      throw new NotFoundError('Item not found');
    }

    return result;
  }

  async deleteItemsBySession(sessionId) {
    sessionId = this.normalizeId(sessionId, 'session ID');

    const result = await Item.deleteMany({ sessionId });
    return result.deletedCount;
  }

  async getMultipleItems(itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new ValidationError('Item IDs must be a non-empty array');
    }

    const normalizedIds = itemIds.map(id => this.normalizeId(id, 'item ID'));

    const items = await Item.find({ _id: { $in: normalizedIds } });

    if (items.length !== normalizedIds.length) {
      throw new NotFoundError('One or more items not found');
    }

    return items;
  }

  async validateItemsInSession(itemIds, sessionId) {
    sessionId = this.normalizeId(sessionId, 'session ID');

    const items = await this.getMultipleItems(itemIds);

    const invalid = items.filter(i => i.sessionId !== sessionId);
    if (invalid.length) {
      throw new ValidationError('All items must belong to the same session');
    }

    return items;
  }
}

module.exports = new ItemService();
