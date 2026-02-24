import { jest } from '@jest/globals';
import catchAsync from '../../../src/utils/catchAsync.js';

describe('catchAsync', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should execute async function successfully', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch errors and call next with error', async () => {
    const testError = new Error('Test async error');
    const asyncFn = jest.fn().mockRejectedValue(testError);
    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should pass request to wrapped function', async () => {
    const requestData = { body: { name: 'Test' } };
    const asyncFn = jest.fn().mockResolvedValue();
    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(requestData, mockRes, mockNext);

    expect(asyncFn).toHaveBeenCalledWith(requestData, mockRes, mockNext);
  });

  it('should handle controller that sends response', async () => {
    const asyncController = async (req, res) => {
      res.status(200).json({ message: 'OK' });
    };
    const wrappedController = catchAsync(asyncController);

    await wrappedController(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'OK' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch synchronous throws in async function', async () => {
    const syncError = new Error('Sync error in async');
    const asyncFn = async () => {
      throw syncError;
    };
    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(syncError);
  });

  it('should return a function', () => {
    const asyncFn = async () => {};
    const wrappedFn = catchAsync(asyncFn);

    expect(typeof wrappedFn).toBe('function');
  });
});
