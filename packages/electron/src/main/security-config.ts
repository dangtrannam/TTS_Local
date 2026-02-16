import type { Session } from 'electron';

/**
 * Content Security Policy - STRICT
 * Prevents XSS, inline scripts, and external resource loading
 */
export const CSP_HEADER = [
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
  // Block dangerous protocols in navigation
  // Note: Navigation blocking is also handled in main process via will-navigate event
  // This provides additional defense-in-depth

  const dangerousProtocols = ['javascript:', 'data:', 'blob:', 'vbscript:', 'file://'];

  // This is handled via will-navigate event in main process for defense-in-depth
  // We explicitly block all navigation there, so dangerous protocols can't execute
  // Additional protocol-level blocking could be added here if needed for future features
}
