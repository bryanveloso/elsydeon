import { join } from 'path';

/**
 * Determine content type based on file extension
 */
export const getContentType = (filePath: string): string => {
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.gif')) return 'image/gif';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
};

/**
 * Create a JSON response
 */
export const jsonResponse = (data: any, status: number = 200): Response => {
  return Response.json(data, { status });
};

/**
 * Create an error response
 */
export const errorResponse = (message: string, status: number = 500): Response => {
  return jsonResponse({ error: message }, status);
};

/**
 * Create a file response
 */
export const fileResponse = (file: Blob, contentType?: string): Response => {
  return new Response(file, {
    headers: { 'Content-Type': contentType || getContentType(file.toString()) }
  });
};

/**
 * Create a static file response from a path
 */
export const staticFileResponse = async (
  basePath: string,
  urlPath: string,
  fallbackPath?: string
): Promise<Response> => {
  let file = Bun.file(join(basePath, urlPath));
  
  // If file doesn't exist and fallback path is provided, try fallback
  if (fallbackPath && !(await file.exists())) {
    file = Bun.file(join(fallbackPath, urlPath));
  }
  
  if (!(await file.exists())) {
    return errorResponse('File not found', 404);
  }
  
  return fileResponse(file, getContentType(urlPath));
};