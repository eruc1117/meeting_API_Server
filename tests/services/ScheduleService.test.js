const ScheduleService = require('../../services/ScheduleService');
const db = require('../../db');

jest.mock('../../db');

describe('ScheduleService.createSchedule', () => {
  it('should return 201 and schedule data if creation is successful', async () => {
    const mockSchedule = {
      id: 1,
      user_id: 1,
      title: 'Meeting',
      description: 'Discuss project',
      start_time: '2025-05-08T09:00:00',
      end_time: '2025-05-08T10:00:00',
      created_at: '2025-05-08T09:00:00'
    };
    db.query.mockResolvedValue({ rows: [mockSchedule] });

    const res = await ScheduleService.createSchedule(
      1, 'Meeting', 'Discuss project', '2025-05-08T09:00:00', '2025-05-08T10:00:00'
    );

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Event created');
    expect(res.body.schedule).toEqual(mockSchedule);
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await ScheduleService.createSchedule(null, '', '', '', '');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing required fields');
  });

  it('should return 400 if db throws error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));

    const res = await ScheduleService.createSchedule(
      1, 'Meeting', 'Error test', '2025-05-08T09:00:00', '2025-05-08T10:00:00'
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('伺服器回傳錯誤訊息');
  });
});


describe('ScheduleService.getSchedulesByUserId', () => {
  it('should return schedules for user', async () => {
    const mockSchedules = [
      { id: 1, user_id: 1, title: 'Meeting', start_time: '2025-05-08T09:00:00' }
    ];
    db.query.mockResolvedValue({ rows: mockSchedules });

    const result = await ScheduleService.getSchedulesByUserId(1);
    expect(result).toEqual(mockSchedules);
  });

  it('should throw error if DB fails', async () => {
    db.query.mockRejectedValue(new Error('DB error'));

    await expect(ScheduleService.getSchedulesByUserId(1)).rejects.toThrow('Database error');
  });
});

jest.mock('../../db');

describe('ScheduleService.updateSchedule', () => {
  it('should return 200 and updated schedule if update is successful', async () => {
    const mockSchedule = {
      id: 1,
      user_id: 1,
      title: 'Updated Title',
      description: 'Updated Description',
      start_time: '2025-05-08 10:00:00',
      end_time: '2025-05-08 11:00:00',
      created_at: '2025-05-08 09:00:00'
    };

    // 第一次查詢：確認 schedule 是否屬於 user
    db.query.mockResolvedValueOnce({ rows: [mockSchedule] });

    // 第二次查詢：更新 schedule 並回傳
    db.query.mockResolvedValueOnce({ rows: [mockSchedule] });

    const res = await ScheduleService.updateSchedule(
      1, // user_id
      1, // schedule_id
      'Updated Title',
      'Updated Description',
      '2025-05-08 10:00:00',
      '2025-05-08 11:00:00'
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Schedule updated');
    expect(res.body.schedule).toEqual(mockSchedule);
  });

  it('should return 404 if schedule not found or does not belong to user', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // SELECT 查無資料

    const res = await ScheduleService.updateSchedule(
      1, 99, 'New Title', 'desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00'
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('找不到該行事曆或權限不足');
  });

  it('should throw error if database fails', async () => {
    db.query.mockRejectedValue(new Error('DB error'));

    await expect(ScheduleService.updateSchedule(
      1, 1, 'Title', 'Desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00'
    )).rejects.toThrow('DB error');
  });
});