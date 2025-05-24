const ScheduleController = require('../../controllers/ScheduleController');
const ScheduleService = require('../../services/ScheduleService');

jest.mock('../../services/ScheduleService');

describe('ScheduleController.create', () => {
  const mockReq = {
    body: {
      title: 'Test Event',
      description: 'Details...',
      start_time: '2025-05-08T09:00:00',
      end_time: '2025-05-08T10:00:00'
    },
    user: {
      id: 1,
    }
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 and event data if creation successful', async () => {
    await ScheduleService.createSchedule.mockResolvedValue({
      status: 201,
      body: {
        message: '活動建立成功',
        data: { schedule: { id: 1, ...mockReq.body, created_at: '2025-05-08T09:00:00' } },
        error: {}
      }
    });

    await ScheduleController.create(mockReq, mockRes);
    const {title, description, start_time, end_time} = mockReq.body;
    const user_id =  mockReq.user.id;
    expect(ScheduleService.createSchedule).toHaveBeenCalledWith(user_id, title, description, start_time, end_time);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: '活動建立成功'
    }));
  });

  it('should return 409 if time conflict', async () => {
    await ScheduleService.createSchedule.mockResolvedValue({
      status: 409,
      body: {
        message: '活動建立失敗，時段重複',
        data: { reStartTime: '2025-05-08T09:00:00', reEndTime: '2025-05-08T10:00:00' },
        error: { code: 'E004_UNAUTHORIZED' }
      }
    });

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: '活動建立失敗，時段重複',
      error: { code: 'E004_UNAUTHORIZED' }
    }));
  });

  it('should return 400 if missing fields', async () => {
    await ScheduleService.createSchedule.mockResolvedValue({
      status: 400,
      body: {
        message: '活動建立失敗，資料未提供',
        data: {},
        error: { code: 'E007_NOT_FOUND' }
      }
    });

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: '活動建立失敗，資料未提供',
      error: { code: 'E007_NOT_FOUND' }
    }));
  });

  it('should return 401 if user not logged in', async () => {
    await ScheduleService.createSchedule.mockResolvedValue({
      status: 401,
      body: {
        message: '活動建立失敗，未登入',
        data: {},
        error: { code: 'E004_UNAUTHORIZED' }
      }
    });

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: '活動建立失敗，未登入',
      error: { code: 'E004_UNAUTHORIZED' }
    }));
  });

  it('should return 500 if service throws error', async () => {
    await ScheduleService.createSchedule.mockRejectedValue(new Error('DB error'));

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
