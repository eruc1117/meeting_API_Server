it('should return 403 if IP is not allowed', async () => {
    const forbiddenIPReq = {
      ...mockReq,
      ip: '123.45.67.89' // 模擬不允許的 IP
    };
  
    // 假設 ScheduleService 會先檢查 IP 並回傳對應錯誤（可根據你的架構調整）
    ScheduleService.createSchedule.mockResolvedValue({
      status: 403,
      body: {
        message: '禁止存取：來源 IP 不允許',
        data: {},
        error: { code: 'E008_FORBIDDEN_IP' }
      }
    });
  
    await ScheduleController.create(forbiddenIPReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: '禁止存取：來源 IP 不允許',
      data: {},
      error: { code: 'E008_FORBIDDEN_IP' }
    });
  });
  