export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    // Simple structured console output without logging sensitive body payloads
    const icon = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';
    console.log(`${icon} [${method}] ${originalUrl} -> ${statusCode} (${duration}ms)`);
  });

  next();
}
