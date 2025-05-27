function mapErrorCodeToStatusCode(errorCode) {
    const map = {
        E000_INTERNAL_ERROR: 500,
        E001_USER_EXISTS: 409,
        E002_INVALID_EMAIL: 400,
        E003_INVALID_CREDENTIALS: 401,
        E004_UNAUTHORIZED: 401,
        E005_FORBIDDEN: 403,
        E006_SCHEDULE_CONFLICT: 409,
        E007_NOT_FOUND: 404,
        E008_ACCOUNT_NOT_EXIST: 404,
        E009_PASSWORD_NOT_SAME: 400,
        E010_SCHEDULE_SERVER: 500,
        E011_DATA_TYPE_ERROR: 400,
    };

    return map[errorCode] || 500; // fallback to 500 if not found
}

module.exports = { mapErrorCodeToStatusCode };
