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
      is_public: true,
      location: '會議室 A',
      participants: '小明、小美'
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
      data: { id: 1, ...mockReq.body, created_at: '2025-05-08T09:00:00' }
    };

    ScheduleService.createSchedule.mockResolvedValue(mockResult);

    await ScheduleController.create(mockReq, mockRes);

    const { title, description, start_time, end_time, is_public, location, participants } = mockReq.body;
    const user_id = mockReq.user.id;
    expect(ScheduleService.createSchedule).toHaveBeenCalledWith(user_id, title, description, start_time, end_time, is_public, location, participants);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: '活動建立成功' }));
  });

  it('should return 409 if time conflict', async () => {
    const mockResult = {
      message: '活動建立失敗，時段重複',
      data: {},
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
      data: {},
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

  it('should return 500 if service throws error', async () => {
    ScheduleService.createSchedule.mockRejectedValue(new Error('DB error'));

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});


describe('ScheduleController.getUserSchedules', () => {
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('應回傳 200 與活動列表', async () => {
    const req = {
      user: { id: 1 },
      body: { start_time: '2026-02-01T00:00:00', end_time: '2026-02-28T23:59:59' }
    };
    const mockResult = {
      message: '活動查詢成功',
      data: { schedule: [{ id: 1, title: 'Test', is_public: false, location: null, participants: null }] }
    };

    ScheduleService.getSchedulesByUserId.mockResolvedValue(mockResult);

    await ScheduleController.getUserSchedules(req, mockRes);

    expect(ScheduleService.getSchedulesByUserId).toHaveBeenCalledWith(1, '2026-02-01T00:00:00', '2026-02-28T23:59:59');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: '活動查詢成功' }));
  });

  it('start_time / end_time 未提供時仍可查詢', async () => {
    const req = { user: { id: 1 }, body: {} };
    const mockResult = { message: '活動查詢成功', data: { schedule: [] } };

    ScheduleService.getSchedulesByUserId.mockResolvedValue(mockResult);

    await ScheduleController.getUserSchedules(req, mockRes);

    expect(ScheduleService.getSchedulesByUserId).toHaveBeenCalledWith(1, undefined, undefined);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('service 拋出例外時回傳 500', async () => {
    const req = { user: { id: 1 }, body: {} };
    ScheduleService.getSchedulesByUserId.mockRejectedValue(new Error('DB error'));

    await ScheduleController.getUserSchedules(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});


describe('ScheduleController.attend', () => {
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 on successful attend', async () => {
    const req = { params: { id: '1' }, user: { id: 1 } };
    const mockResult = { message: '活動參加成功', data: {} };

    ScheduleService.attendSchedule.mockResolvedValue(mockResult);

    await ScheduleController.attend(req, mockRes);

    expect(ScheduleService.attendSchedule).toHaveBeenCalledWith(1, 1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 404 if schedule not found or closed', async () => {
    const req = { params: { id: '999' }, user: { id: 1 } };
    const mockResult = {
      message: '活動參加失敗，活動不存在或已關閉',
      data: {},
      error: { code: 'E007_NOT_FOUND' }
    };

    ScheduleService.attendSchedule.mockResolvedValue(mockResult);

    await ScheduleController.attend(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 500 if service throws', async () => {
    const req = { params: { id: '1' }, user: { id: 1 } };
    ScheduleService.attendSchedule.mockRejectedValue(new Error('DB error'));

    await ScheduleController.attend(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});


describe('ScheduleController.unattend', () => {
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 on successful unattend', async () => {
    const req = { params: { id: '1' }, user: { id: 1 } };
    const mockResult = { message: '活動退出成功', data: {} };

    ScheduleService.unattendSchedule.mockResolvedValue(mockResult);

    await ScheduleController.unattend(req, mockRes);

    expect(ScheduleService.unattendSchedule).toHaveBeenCalledWith(1, 1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 404 if user not attending', async () => {
    const req = { params: { id: '999' }, user: { id: 1 } };
    const mockResult = {
      message: '活動退出失敗，使用者未參加該活動',
      data: {},
      error: { code: 'E007_NOT_FOUND' }
    };

    ScheduleService.unattendSchedule.mockResolvedValue(mockResult);

    await ScheduleController.unattend(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 500 if service throws', async () => {
    const req = { params: { id: '1' }, user: { id: 1 } };
    ScheduleService.unattendSchedule.mockRejectedValue(new Error('DB error'));

    await ScheduleController.unattend(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
