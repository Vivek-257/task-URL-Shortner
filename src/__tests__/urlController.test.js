const { redirectUrl, shortenUrl } = require('../controllers/urlController.js');
const { getDatabase } = require('../utils/db.js');
const redisClient = require('../utils/redis.js');

jest.mock('../utils/db', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('../utils/redis', () => ({
  get: jest.fn(),
  setEx: jest.fn(),
}));

describe('URL Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('redirectUrl', () => {
    it('should redirect to cached URL if available', async () => {
      redisClient.get.mockResolvedValue('http://example.com');
      const req = { params: { alias: 'testAlias' } };
      const res = { redirect: jest.fn() };

      await redirectUrl(req, res);

      expect(redisClient.get).toHaveBeenCalledWith('shortUrl:testAlias');
      expect(res.redirect).toHaveBeenCalledWith('http://example.com');
    });

    it('should fetch URL from database if not cached', async () => {
      redisClient.get.mockResolvedValue(null);
      const mockDb = { collection: jest.fn(() => ({ findOne: jest.fn(() => ({ longUrl: 'http://example.com' })) })) };
      getDatabase.mockReturnValue(mockDb);
      const req = { params: { alias: 'testAlias' } };
      const res = { redirect: jest.fn() };

      await redirectUrl(req, res);

      expect(mockDb.collection).toHaveBeenCalledWith('shortUrls');
      expect(redisClient.setEx).toHaveBeenCalledWith('shortUrl:testAlias', 3600, 'http://example.com');
      expect(res.redirect).toHaveBeenCalledWith('http://example.com');
    });

    it('should return 404 if alias is not found in database', async () => {
      redisClient.get.mockResolvedValue(null);
      const mockDb = { collection: jest.fn(() => ({ findOne: jest.fn(() => null) })) };
      getDatabase.mockReturnValue(mockDb);
      const req = { params: { alias: 'unknownAlias' } };
      const res = { status: jest.fn(() => res), send: jest.fn() };

      await redirectUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('URL not found');
    });
  });

  describe('shortenUrl', () => {
    it('should return error if longUrl is not provided', async () => {
      const req = { body: {}, user: { id: '123' } };
      const res = { render: jest.fn() };

      await shortenUrl(req, res);

      expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
        shortUrl: null,
        error: 'Long URL is required',
      }));
    });

    it('should return error if alias is already in use', async () => {
      const mockDb = { collection: jest.fn(() => ({ findOne: jest.fn(() => ({ alias: 'testAlias' })) })) };
      getDatabase.mockReturnValue(mockDb);
      const req = { body: { longUrl: 'http://example.com', alias: 'testAlias' }, user: { id: '123' } };
      const res = { render: jest.fn() };

      await shortenUrl(req, res);

      expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
        shortUrl: null,
        error: 'Alias already in use',
      }));
    });
  });
});
