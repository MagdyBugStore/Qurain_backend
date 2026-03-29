/**
 * 404 Not Found middleware
 */

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
    meta: {},
  });
};
