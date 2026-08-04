// Собирает ошибки валидации в единый формат ответа
function buildError(errors) {
  return {
    success: false,
    message: 'Validation failed',
    errors,
    statusCode: 400,
  };
}

// Валидирует req.query по описанной схеме и, если всё ок,
// заменяет req.query на объект с уже приведёнными типами (числа/даты остаются строками ISO,
// но проверенными на корректность).
function validateQuery(schema) {
  return (req, res, next) => {
    const errors = [];
    const cleaned = {};

    for (const [field, rules] of Object.entries(schema)) {
      const raw = req.query[field];

      if (raw === undefined || raw === '') {
        if (rules.required) {
          errors.push({ field, message: `${field} is required` });
        } else if (rules.default !== undefined) {
          cleaned[field] = rules.default;
        }
        continue;
      }

      switch (rules.type) {
        case 'positiveInt': {
          const num = Number(raw);
          if (!Number.isInteger(num) || num < 1) {
            errors.push({ field, message: `${field} must be a positive integer` });
          } else {
            cleaned[field] = num;
          }
          break;
        }
        case 'number': {
          const num = Number(raw);
          if (Number.isNaN(num)) {
            errors.push({ field, message: `${field} must be a number` });
          } else if (rules.min !== undefined && num < rules.min) {
            errors.push({ field, message: `${field} must be ${rules.min} or greater` });
          } else {
            cleaned[field] = num;
          }
          break;
        }
        case 'date': {
          const date = new Date(raw);
          if (Number.isNaN(date.getTime())) {
            errors.push({ field, message: `${field} must be a valid date` });
          } else {
            cleaned[field] = raw;
          }
          break;
        }
        case 'enum': {
          if (!rules.values.includes(raw)) {
            errors.push({ field, message: `${field} must be one of: ${rules.values.join(', ')}` });
          } else {
            cleaned[field] = raw;
          }
          break;
        }
        case 'string': {
          if (rules.maxLength && raw.length > rules.maxLength) {
            errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
          } else {
            cleaned[field] = raw;
          }
          break;
        }
        default:
          cleaned[field] = raw;
      }
    }

    if (errors.length) {
      return res.status(400).json(buildError(errors));
    }

    req.validatedQuery = cleaned;
    next();
  };
}

module.exports = { validateQuery, buildError };