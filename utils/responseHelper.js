const { mapErrorCodeToStatusCode } = require('./httpStatusMapper');

function sendResponse(res, result, successStatus = 200) {
  const status = result.error
    ? mapErrorCodeToStatusCode(result.error.code)
    : successStatus;
  res.status(status).json(result);
}

module.exports = { sendResponse };
