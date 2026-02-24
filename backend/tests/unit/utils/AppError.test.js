import AppError from '../../../src/utils/AppError.js';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 404);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should set status to "fail" for 4xx errors', () => {
      const error400 = new AppError('Bad request', 400);
      const error404 = new AppError('Not found', 404);
      const error401 = new AppError('Unauthorized', 401);

      expect(error400.status).toBe('fail');
      expect(error404.status).toBe('fail');
      expect(error401.status).toBe('fail');
    });

    it('should set status to "error" for 5xx errors', () => {
      const error500 = new AppError('Server error', 500);
      const error503 = new AppError('Service unavailable', 503);

      expect(error500.status).toBe('error');
      expect(error503.status).toBe('error');
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test', 400);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('should mark error as operational', () => {
      const error = new AppError('Operational error', 400);

      expect(error.isOperational).toBe(true);
    });
  });

  describe('common error scenarios', () => {
    it('should create not found error (404)', () => {
      const error = new AppError('User not found', 404);

      expect(error.statusCode).toBe(404);
      expect(error.status).toBe('fail');
    });

    it('should create unauthorized error (401)', () => {
      const error = new AppError('Not authorized', 401);

      expect(error.statusCode).toBe(401);
      expect(error.status).toBe('fail');
    });

    it('should create bad request error (400)', () => {
      const error = new AppError('Invalid input', 400);

      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
    });

    it('should create forbidden error (403)', () => {
      const error = new AppError('Access denied', 403);

      expect(error.statusCode).toBe(403);
      expect(error.status).toBe('fail');
    });
  });
});
