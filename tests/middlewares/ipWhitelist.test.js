// 白名單在模組載入時就從環境變數讀出來，所以要在 require 之前設好（.env.test 也有 SOURCEIP，這裡再保險一次）
process.env.SOURCEIP = '127.0.0.1';
const ipWhitelist = require('../../middlewares/ipWhitelist');

describe('ipWhitelist middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next() if IP is allowed', () => {
    req.ip = '127.0.0.1';
    ipWhitelist(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 if IP is not allowed', () => {
    req.ip = '123.123.123.123';
    ipWhitelist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: '禁止存取：來源 IP 不允許',
      error: { code: 'E008_FORBIDDEN_IP' }
    });
    expect(next).not.toHaveBeenCalled();
  });
});
