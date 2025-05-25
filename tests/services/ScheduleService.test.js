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
    created_at: '2025-05-08T09:00:00'
  };
  
  it('活動建立成功，回傳成功訊息', async () => {
  
    Schedule.findEvent.mockResolvedValue({ rows: [] });
    db.query.mockReturnValueOnce({rows: [mockSchedule]});

    const result = await ScheduleService.createSchedule(
      1, 'Meeting', 'Discuss project', '2025-05-08T09:00:00', '2025-05-08T10:00:00'
    );

    expect(result.message).toBe('活動建立成功');
    expect(result.schedule).toEqual(mockSchedule);
  });

  it('資料未提供，回傳錯誤訊息', async () => {
    const result = await ScheduleService.createSchedule(null, '', '', '2025-05-08T09:00:00', '2025-05-08T10:00:00');
    expect(result.message).toBe('活動建立失敗，資料未提供');
    expect(result.error.code).toBe('E007_NOT_FOUND');
  });

  it('重複時段建立活動，回傳錯誤訊息', async () => {

    Schedule.findEvent.mockResolvedValue([mockSchedule]);

    const secResult = await ScheduleService.createSchedule(
      1, 'Repeat Meeting', 'Discuss project', '2025-05-08T09:00:00', '2025-05-08T10:00:00'
    );

    expect(secResult.message).toBe('活動建立失敗，時段重複');
    expect(secResult.error.code).toBe('E006_SCHEDULE_CONFLICT');
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

    const result = await ScheduleService.updateSchedule(
      1, // user_id
      1, // schedule_id
      'Updated Title',
      'Updated Description',
      '2025-05-08 10:00:00',
      '2025-05-08 11:00:00'
    );
    expect(result.message).toBe('活動更新成功');
    expect(result.schedule).toEqual(mockSchedule);
  });

  it('should return 404 if schedule not found or does not belong to user', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // SELECT 查無資料

    const res = await ScheduleService.updateSchedule(
      1, 99, 'New Title', 'desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00'
    );

    expect(res.message).toBe('找不到該行事曆或權限不足');
  });

  it('should throw error if database fails', async () => {
    db.query.mockRejectedValue(new Error('DB error'));

    await expect(ScheduleService.updateSchedule(
      1, 1, 'Title', 'Desc', '2025-05-08 10:00:00', '2025-05-08 11:00:00'
    )).rejects.toThrow('DB error');
  });
});


describe('ScheduleService.deleteSchedule', () => {
  it('should return 200 if schedule is deleted successfully', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }) // SELECT 查詢有結果
      .mockResolvedValueOnce({}); // DELETE 成功

    const result = await ScheduleService.deleteSchedule(1, 1);

    expect(result.message).toBe('活動刪除成功');
  });

  it('should return 404 if schedule does not belong to user', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // SELECT 查詢無結果

    const result = await ScheduleService.deleteSchedule(2, 999);
    expect(result.message).toBe('找不到該行事曆或權限不足');
    expect(result.error.code).toBe('007_NOT_FOUND');
  });

  it('should throw error if DB fails', async () => {
    db.query.mockRejectedValue(new Error('DB error'));

    await expect(ScheduleService.deleteSchedule(1, 1)).rejects.toThrow('DB error');
  });
});