/**
 * Standardized API response helpers.
 * Use these in every controller for consistent response format.
 *
 * Usage:
 *   return ApiResponse.success(res, data, "Users fetched");
 *   return ApiResponse.created(res, newUser, "User created");
 *   return ApiResponse.noContent(res);
 *   return ApiResponse.paginated(res, users, page, limit, total);
 */
class ApiResponse {
  // 200 — OK
  static success(res, data = null, message = "Success") {
    return res.status(200).json({
      status: "success",
      message,
      data,
    });
  }

  // 201 — Created
  static created(res, data = null, message = "Created successfully") {
    return res.status(201).json({
      status: "success",
      message,
      data,
    });
  }

  // 204 — No Content (for delete operations)
  static noContent(res) {
    return res.status(204).json();
  }

  // 200 — Paginated list
  static paginated(res, data, page, limit, total, message = "Success") {
    return res.status(200).json({
      status: "success",
      message,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}

export default ApiResponse;
