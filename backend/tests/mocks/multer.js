// Mock multer for testing
const mockMulter = () => ({
  array: (fieldName, maxCount) => (req, res, next) => {
    req.files = req.files || [];
    next();
  },
  single: (fieldName) => (req, res, next) => {
    req.file = req.file || null;
    next();
  }
});

mockMulter.diskStorage = () => ({
  destination: () => {},
  filename: () => {}
});

mockMulter.MulterError = class MulterError extends Error {
  constructor(code, field) {
    super(`MulterError: ${code}`);
    this.code = code;
    this.field = field;
  }
};

module.exports = mockMulter;
