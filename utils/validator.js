const validator = {
    // L-01 修正：要求 TLD 至少 2 個字元
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        return re.test(email);
    },

    // M-06 修正：限制日期在合理範圍內（不接受無效或過遠的日期）
    validateDateTime: (dateTime) => {
        const date = new Date(dateTime);
        if (isNaN(date.getTime())) return false;
        const now = new Date();
        const twoYearsLater = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
        return date >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) && date <= twoYearsLater;
    },

    // H-02 新增：密碼強度驗證（最少 8 字元、含大小寫英文與數字）
    validatePassword: (password) => {
        if (!password || password.length < 8) return false;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasUpperCase && hasLowerCase && hasNumber;
    },
}

module.exports = validator;
