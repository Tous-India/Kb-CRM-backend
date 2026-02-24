import { jest } from '@jest/globals';
import ApiResponse from '../../../src/utils/apiResponse.js';

// Mock Express response object
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ApiResponse', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('success', () => {
    it('should return 200 status with data and message', () => {
      const data = { id: 1, name: 'Test' };

      ApiResponse.success(mockRes, data, 'Fetched successfully');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Fetched successfully',
        data
      });
    });

    it('should use default message if not provided', () => {
      ApiResponse.success(mockRes, { test: true });

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: { test: true }
      });
    });

    it('should handle null data', () => {
      ApiResponse.success(mockRes, null, 'No data');

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'No data',
        data: null
      });
    });
  });

  describe('created', () => {
    it('should return 201 status with data', () => {
      const newUser = { id: 1, email: 'test@test.com' };

      ApiResponse.created(mockRes, newUser, 'User created');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User created',
        data: newUser
      });
    });

    it('should use default message if not provided', () => {
      ApiResponse.created(mockRes, { id: 1 });

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Created successfully',
        data: { id: 1 }
      });
    });
  });

  describe('noContent', () => {
    it('should return 204 status', () => {
      ApiResponse.noContent(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('paginated', () => {
    it('should return paginated response with correct structure', () => {
      const users = [{ id: 1 }, { id: 2 }];

      ApiResponse.paginated(mockRes, users, 1, 10, 25, 'Users fetched');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Users fetched',
        data: users,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      });
    });

    it('should calculate totalPages correctly', () => {
      ApiResponse.paginated(mockRes, [], 1, 10, 100);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 10
          })
        })
      );
    });

    it('should handle string page and limit values', () => {
      ApiResponse.paginated(mockRes, [], '2', '20', 50);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 2,
            limit: 20,
            total: 50,
            totalPages: 3
          }
        })
      );
    });

    it('should use default message', () => {
      ApiResponse.paginated(mockRes, [], 1, 10, 0);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Success'
        })
      );
    });
  });
});
