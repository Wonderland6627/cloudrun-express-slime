// 参数验证中间件
const { validationError } = require('./response');

/**
 * 验证必需参数
 * @param {Array<string>} fields - 需要验证的字段名数组
 * @param {string} source - 参数来源: 'body', 'query', 'params'
 */
function validateRequired(fields, source = 'body') {
  return (req, res, next) => {
    const sourceObj = req[source] || {};
    const missing = [];
    
    for (const field of fields) {
      if (sourceObj[field] === undefined || sourceObj[field] === null || sourceObj[field] === '') {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      return validationError(res, `Missing required fields: ${missing.join(', ')}`);
    }
    
    next();
  };
}

/**
 * 验证code参数
 */
function validateCode(req, res, next) {
  const code = req.body.code || req.query.code;
  
  if (!code) {
    return validationError(res, 'code parameter is required');
  }
  
  next();
}

module.exports = {
  validateRequired,
  validateCode
};

