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
        message: 'Event created',
        schedule: { id: 1, ...mockReq.body, created_at: '2025-05-08T09:00:00' }
      }
    });

    await ScheduleController.create(mockReq, mockRes);
    const {title, description, start_time, end_time} = mockReq.body;
    const user_id =  mockReq.user.id;
    expect(ScheduleService.createSchedule).toHaveBeenCalledWith(user_id, title, description, start_time, end_time);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Event created'
    }));
  });

  it('should return 500 if service throws error', async () => {
    await ScheduleService.createSchedule.mockRejectedValue(new Error('DB error'));

    await ScheduleController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});


describe('ScheduleController.getUserSchedules', () => {
  it('should return 200 and schedules', async () => {
    const mockSchedules = [{ id: 1, title: 'Test Event' }];
    ScheduleService.getSchedulesByUserId.mockResolvedValue(mockSchedules);

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await ScheduleController.getUserSchedules(req, res);

    expect(ScheduleService.getSchedulesByUserId).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ schedules: mockSchedules });
  });

  it('should return 500 on error', async () => {
    ScheduleService.getSchedulesByUserId.mockRejectedValue(new Error('error'));

    const req = { user: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await ScheduleController.getUserSchedules(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: '伺服器回傳錯誤訊息' });
  });
});
