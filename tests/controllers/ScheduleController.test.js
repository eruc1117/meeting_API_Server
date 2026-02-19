const ScheduleController = require('../../controllers/ScheduleController');
const ScheduleService = require('../../services/ScheduleService');

jest.mock('../../services/ScheduleService');

describe('ScheduleController.create', () => {
  const mockReq = {
    body: {
      title: 'Test Event',
      description: 'Details...',
      start_time: '2025-05-08T09:00:00',
      end_time: '2025-05-08T10:00:00',
      isOpen: true
    },
    user: { id: 1 }
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 and event data if creation successful', async () => {
    const mockResult = {
      message: '活動建立成功',
      schedule: { id: 1, ...mockReq.body, created_at: '2025-05-08T09:00:00' }
    };

    ScheduleService.createSchedule.mockResolvedValue(mockResult);

    await ScheduleController.create(mockReq, mockRes);

    const { title, description, start_time, end_time, isOpen } = mockReq.body;
    const user_id = mockReq.user.id;
    expect(ScheduleService.createSchedule).toHaveBeenCalledWith(user_id, title, description, start_time, end_time, isOpen);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: '活動建立成功' }));
  });

  it('should return 409 if time conflict', async () => {
    const mockResult = {
      message: '活動建立失敗，時段重複',
      error: { code: 'E006_SCHEDULE_CONFLICT' }
    };

    ScheduleService.createSchedule.mockResolvedValue(mockResult);

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: '活動建立失敗，時段重複',
      error: { code: 'E006_SCHEDULE_CONFLICT' }
    }));
  });

  it('should return 400 if missing fields', async () => {
    const mockResult = {
      message: '活動建立失敗，資料未提供',
      error: { code: 'E012_MISSING_FIELDS' }
    };

    ScheduleService.createSchedule.mockResolvedValue(mockResult);

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: '活動建立失敗，資料未提供',
      error: { code: 'E012_MISSING_FIELDS' }
    }));
  });

  it('should return 401 if user not logged in', async () => {
    const mockResult = {
      message: '活動建立失敗，未登入',
      error: { code: 'E004_UNAUTHORIZED' }
    };

    ScheduleService.createSchedule.mockResolvedValue(mockResult);

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: '活動建立失敗，未登入',
      error: { code: 'E004_UNAUTHORIZED' }
    }));
  });

  it('should return 500 if service throws error', async () => {
    ScheduleService.createSchedule.mockRejectedValue(new Error('DB error'));

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
