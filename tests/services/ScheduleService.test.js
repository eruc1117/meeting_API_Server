const ScheduleService = require('../../services/ScheduleService');
const Schedule = require("../../models/Schedule");
const db = require('../../db');

jest.mock('../../db');
jest.mock("../../models/Schedule");

// 使用動態日期，避免寫死日期隨時間超出 validateDateTime 允許範圍
const START_TIME = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
const END_TIME = new Date(Date.now() + 25 * 3600 * 1000).toISOString();

describe('ScheduleService.createSchedule', () => {

  const mockSchedule = {
    id: 1,
    user_id: 1,
    title: 'Meeting',
    description: 'Discuss project',
    start_time: START_TIME,
    end_time: END_TIME,
    is_public: true,
    location: '會議室 A',
    participants: '小明',
    created_at: '2025-05-08T09:00:00',
    updated_at: '2025-05-08T09:00:00'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('活動建立成功，回傳成功訊息', async () => {
    Schedule.findEvent.mockResolvedValue([]);
    db.query.mockReturnValueOnce({ rows: [mockSchedule] });

    const result = await ScheduleService.createSchedule(
      1, 'Meeting', 'Discuss project', START_TIME, END_TIME, true, '會議室 A', '小明'
    );

    expect(result.message).toBe('活動建立成功');
    expect(result.data).toEqual(mockSchedule);
  });

  it('資料未提供，回傳錯誤訊息', async () => {
    const result = await ScheduleService.createSchedule(null, '', '', START_TIME, END_TIME, true);
    expect(result.message).toBe('活動建立失敗，資料未提供');
    expect(result.error.code).toBe('E012_MISSING_FIELDS');
  });

  it('重複時段建立活動，回傳錯誤訊息', async () => {
    Schedule.findEvent.mockResolvedValue([mockSchedule]);

    const result = await ScheduleService.createSchedule(
      1, 'Repeat Meeting', 'Discuss project', START_TIME, END_TIME, true, null, null
    );

    expect(result.message).toBe('活動建立失敗，時段重複');
    expect(result.error.code).toBe('E006_SCHEDULE_CONFLICT');
  });

});


describe('ScheduleService.getSchedulesByUserId', () => {
  it('should return schedules for user', async () => {
    const mockSchedules = [
      { id: 1, user_id: 1, title: 'Meeting', start_time: START_TIME, is_public: true, location: '會議室 A', participants: '小明' }
    ];
    db.query.mockResolvedValue({ rows: mockSchedules });

    const result = await ScheduleService.getSchedulesByUserId(1);
    expect(result.message).toBe('活動查詢成功');
    expect(result.data.schedule).toEqual(mockSchedules);
  });

  it('should return E010 if DB fails', async () => {
    db.query.mockRejectedValue(new Error('DB error'));

    const result = await ScheduleService.getSchedulesByUserId(1);
    expect(result.message).toBe('功能異常');
    expect(result.error.code).toBe('E010_SCHEDULE_SERVER');
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
    is_public: false,
    location: '會議室 B',
    participants: '小美',
    created_at: '2025-05-08 09:00:00'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success message if update is successful', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([mockSchedule]);
    db.query.mockResolvedValueOnce({});

    const result = await ScheduleService.updateSchedule(
      1, 1, 'Updated Title', 'Updated Description', '2025-05-08 10:00:00', '2025-05-08 11:00:00', false, '會議室 B', '小美'
    );
    expect(result.message).toBe('活動更新成功');
    expect(result.data).toEqual({});
  });

  it('should return 404 if schedule not found or does not belong to user', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([]);

    const result = await ScheduleService.updateSchedule(
      1, 99, 'New Title', 'desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00', true, null, null
    );

    expect(result.message).toBe('活動更新失敗');
    expect(result.error.code).toBe('E007_NOT_FOUND');
  });

  it('should throw error if database fails', async () => {
    Schedule.findByIdAndUserId.mockRejectedValue(new Error('DB error'));

    await expect(ScheduleService.updateSchedule(
      1, 1, 'Title', 'Desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00', true, null, null
    )).rejects.toThrow('DB error');
  });
});


describe('ScheduleService.deleteSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success if schedule is deleted successfully', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([{ id: 1, user_id: 1 }]);
    db.query.mockResolvedValueOnce({});

    const result = await ScheduleService.deleteSchedule(1, 1);

    expect(result.message).toBe('活動刪除成功');
    expect(result.data).toEqual({});
  });

  it('should return 404 if schedule does not belong to user', async () => {
    Schedule.findByIdAndUserId.mockResolvedValueOnce([]);

    const result = await ScheduleService.deleteSchedule(2, 999);
    expect(result.message).toBe('活動刪除失敗');
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
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, is_open: true }] }); // 活動存在
    db.query.mockResolvedValueOnce({ rows: [] });                          // 尚未參加（M-09）
    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1, schedule_id: 1 }] }); // INSERT

    const result = await ScheduleService.attendSchedule(1, 1);
    expect(result.message).toBe('活動參加成功');
    expect(result.data).toEqual({});
  });

  // M-09：重複參加需回傳衝突錯誤，不可重複寫入
  it('重複參加同一活動，回傳 E006 錯誤', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, is_open: true }] }); // 活動存在
    db.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });        // 已參加

    const result = await ScheduleService.attendSchedule(1, 1);
    expect(result.message).toBe('活動參加失敗，已參加該活動');
    expect(result.error.code).toBe('E006_SCHEDULE_CONFLICT');
    expect(db.query).toHaveBeenCalledTimes(2); // 不應執行 INSERT
  });

  it('活動不存在或已關閉，回傳失敗訊息', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ScheduleService.attendSchedule(1, 999);
    expect(result.message).toBe('活動參加失敗，活動不存在或已關閉');
    expect(result.error.code).toBe('E007_NOT_FOUND');
    expect(result.data).toEqual({});
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
    expect(result.data).toEqual({});
  });

  it('使用者未參加該活動，回傳失敗訊息', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ScheduleService.unattendSchedule(1, 999);
    expect(result.message).toBe('活動退出失敗，使用者未參加該活動');
    expect(result.error.code).toBe('E007_NOT_FOUND');
    expect(result.data).toEqual({});
  });
});
