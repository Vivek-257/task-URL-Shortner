const { shortenUrl, redirectUrl } = require('../controllers/urlController');
const { getDatabase } = require('../utils/db');
const redisClient = require('../utils/redis');

jest.mock('../utils/db', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('../utils/redis', () => ({
  get: jest.fn(),
  setex: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
}));

describe('URL Controller - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shortenUrl', () => {
    it('should render error if longUrl is not provided', async () => {
      const req = { body: {}, user: { id: '123' } };
      const res = { render: jest.fn() };

      await shortenUrl(req, res);

      expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
        error: 'Long URL is required',
      }));
    });

   
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
});
