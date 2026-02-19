const ScheduleService = require('../../services/ScheduleService');
const Schedule = require("../../models/Schedule");
const db = require('../../db');

jest.mock('../../db');
jest.mock("../../models/Schedule");

describe('ScheduleService.createSchedule', () => {

  const mockSchedule = {
    id: 1,
    user_id: 1,
    title: 'Meeting',
    description: 'Discuss project',
    start_time: '2025-05-08T09:00:00',
    end_time: '2025-05-08T10:00:00',
    created_at: '2025-05-08T09:00:00',
    isOpen: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('活動建立成功，回傳成功訊息', async () => {
    Schedule.findEvent.mockResolvedValue([]);
    db.query.mockReturnValueOnce({ rows: [mockSchedule] });

    const result = await ScheduleService.createSchedule(
      1, 'Meeting', 'Discuss project', '2025-05-08T09:00:00', '2025-05-08T10:00:00', true
    );

    expect(result.message).toBe('活動建立成功');
    expect(result.schedule).toEqual(mockSchedule);
  });

  it('資料未提供，回傳錯誤訊息', async () => {
    const result = await ScheduleService.createSchedule(null, '', '', '2025-05-08T09:00:00', '2025-05-08T10:00:00', true);
    expect(result.message).toBe('活動建立失敗，資料未提供');
    expect(result.error.code).toBe('E012_MISSING_FIELDS');
  });

  it('重複時段建立活動，回傳錯誤訊息', async () => {
    Schedule.findEvent.mockResolvedValue([mockSchedule]);

    const result = await ScheduleService.createSchedule(
      1, 'Repeat Meeting', 'Discuss project', '2025-05-08T09:00:00', '2025-05-08T10:00:00', true
    );

    expect(result.message).toBe('活動建立失敗，時段重複');
    expect(result.error.code).toBe('E006_SCHEDULE_CONFLICT');
  });

});


describe('ScheduleService.getSchedulesByUserId', () => {
  it('should return schedules for user', async () => {
    const mockSchedules = [
      { id: 1, user_id: 1, title: 'Meeting', start_time: '2025-05-08T09:00:00', isOpen: true }
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


describe('ScheduleService.updateSchedule', () => {
  const mockSchedule = {
    id: 1,
    user_id: 1,
    title: 'Updated Title',
    description: 'Updated Description',
    start_time: '2025-05-08 10:00:00',
    end_time: '2025-05-08 11:00:00',
    created_at: '2025-05-08 09:00:00',
    isOpen: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and updated schedule if update is successful', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([mockSchedule]);
    db.query.mockResolvedValueOnce({ rows: [mockSchedule] });

    const result = await ScheduleService.updateSchedule(
      1, 1, 'Updated Title', 'Updated Description', '2025-05-08 10:00:00', '2025-05-08 11:00:00', false
    );
    expect(result.message).toBe('活動更新成功');
    expect(result.schedule).toEqual(mockSchedule);
  });

  it('should return 404 if schedule not found or does not belong to user', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([]);

    const result = await ScheduleService.updateSchedule(
      1, 99, 'New Title', 'desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00', true
    );

    expect(result.message).toBe('找不到該行事曆或權限不足');
  });

  it('should throw error if database fails', async () => {
    Schedule.findByIdAndUserId.mockRejectedValue(new Error('DB error'));

    await expect(ScheduleService.updateSchedule(
      1, 1, 'Title', 'Desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00', true
    )).rejects.toThrow('DB error');
  });
});


describe('ScheduleService.deleteSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 if schedule is deleted successfully', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([{ id: 1, user_id: 1 }]);
    db.query.mockResolvedValueOnce({});

    const result = await ScheduleService.deleteSchedule(1, 1);

    expect(result.message).toBe('活動刪除成功');
  });

  it('should return 404 if schedule does not belong to user', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([]);

    const result = await ScheduleService.deleteSchedule(2, 999);
    expect(result.message).toBe('找不到該行事曆或權限不足');
    expect(result.error.code).toBe('E007_NOT_FOUND');
  });

  it('should throw error if DB fails', async () => {
    Schedule.findByIdAndUserId.mockRejectedValue(new Error('DB error'));

    await expect(ScheduleService.deleteSchedule(1, 1)).rejects.toThrow('DB error');
  });
});


describe('ScheduleService.attendSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('活動參加成功，回傳成功訊息', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, is_open: true }] });
    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1, schedule_id: 1 }] });

    const result = await ScheduleService.attendSchedule(1, 1);
    expect(result.message).toBe('活動參加成功');
    expect(result.code).toBe(200);
  });

  it('活動不存在或已關閉，回傳失敗訊息', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ScheduleService.attendSchedule(1, 999);
    expect(result.message).toBe('活動參加失敗，活動不存在或已關閉');
    expect(result.error.code).toBe('E007_NOT_FOUND');
    expect(result.code).toBe(400);
  });
});


describe('ScheduleService.unattendSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('活動退出成功，回傳成功訊息', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1, schedule_id: 1 }] });
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const result = await ScheduleService.unattendSchedule(1, 1);
    expect(result.message).toBe('活動退出成功');
    expect(result.code).toBe(200);
  });

  it('使用者未參加該活動，回傳失敗訊息', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ScheduleService.unattendSchedule(1, 999);
    expect(result.message).toBe('活動退出失敗，使用者未參加該活動');
    expect(result.error.code).toBe('E007_NOT_FOUND');
    expect(result.code).toBe(400);
  });
});
