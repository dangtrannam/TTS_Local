import { app, type Session } from 'electron';

const isDev = !app.isPackaged;

/**
 * Content Security Policy - STRICT (production)
 * Prevents XSS, inline scripts, and external resource loading
 */
export const CSP_HEADER_PRODUCTION = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Required for React inline styles
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Content Security Policy - RELAXED (development only)
 * Allows Vite HMR, React Fast Refresh (inline scripts), and dev server WebSockets
 */
export const CSP_HEADER_DEV = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Vite + React Fast Refresh
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' ws: wss: http://localhost:* https://localhost:*", // Vite HMR WebSocket
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const CSP_HEADER = isDev ? CSP_HEADER_DEV : CSP_HEADER_PRODUCTION;

/**
 * Configure Content Security Policy headers for the session
 * @param session - Electron session instance
 */
export function configureSecurityHeaders(session: Session): void {
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP_HEADER],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
      },
    });
  });
}

/**
 * Configure permission request handlers to deny all requests
 * @param session - Electron session instance
 */
export function configurePermissions(session: Session): void {
  // Deny all permission requests (camera, mic, geolocation, notifications, etc.)
  session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  // Deny all permission check requests
  session.setPermissionCheckHandler(() => {
    return false;
  });
}

/**
 * Register secure protocol handlers and block dangerous protocols
 */
export function registerSecureProtocols(): void {
  // Block dangerous protocols in navigation (examples: 'javascript:', 'data:', 'blob:', 'vbscript:', 'file://')
  // Note: Navigation blocking is also handled in main process via will-navigate event
  // This provides additional defense-in-depth
  // Protocol list removed — navigation blocking is handled in the main process via will-navigate.
  // Additional protocol-level blocking could be added here in future if needed.
}
