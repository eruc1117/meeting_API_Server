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
