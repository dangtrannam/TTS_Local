/**
 * Preload script - exposes secure IPC API to renderer via contextBridge
 * SECURITY: Only whitelisted methods are exposed
 * SECURITY: Never expose raw ipcRenderer.send() or ipcRenderer.on()
 * SECURITY: Use structuredClone() to prevent prototype pollution
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposed TTS API - available in renderer as window.ttsAPI
 */
const ttsAPI = {
  /**
   * Synthesize text to audio
   * @param text - Text to synthesize
   * @param options - Optional TTS options (voice, speed, etc.)
   * @returns ArrayBuffer containing WAV audio data
   */
  synthesize: (text, options) => {
    // Sanitize inputs before sending to main process
    const sanitizedText = String(text);
    const sanitizedOptions = options ? structuredClone(options) : undefined;
    return ipcRenderer.invoke('tts:synthesize', sanitizedText, sanitizedOptions);
  },

  /**
   * Check if TTS system is ready
   */
  isReady: () => {
    return ipcRenderer.invoke('tts:is-ready');
  },

  /**
   * Initialize TTS system (download binary and models)
   */
  setup: () => {
    return ipcRenderer.invoke('tts:setup');
  },

  /**
   * Get list of installed voice models
   */
  listVoices: () => {
    return ipcRenderer.invoke('tts:list-voices');
  },

  /**
   * Get current configuration
   */
  getConfig: () => {
    return ipcRenderer.invoke('tts:get-config');
  },

  /**
   * Update configuration setting
   * @param key - Configuration key (e.g., 'defaultVoice', 'speed')
   * @param value - New value
   */
  setConfig: (key, value) => {
    const sanitizedKey = String(key);
    const sanitizedValue = structuredClone(value);
    return ipcRenderer.invoke('tts:set-config', sanitizedKey, sanitizedValue);
  },

  /**
   * Subscribe to synthesis progress events
   * @param callback - Called when progress updates are received
   * @returns Cleanup function to unsubscribe
   */
  onProgress: (callback) => {
    const handler = (_event, progress) => {
      // Clone data to prevent prototype pollution
      callback(structuredClone(progress));
    };

    ipcRenderer.on('tts:progress', handler);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('tts:progress', handler);
    };
  },

  /**
   * Subscribe to setup progress events
   * @param callback - Called when setup progress updates are received
   * @returns Cleanup function to unsubscribe
   */
  onSetupProgress: (callback) => {
    const handler = (_event, progress) => {
      // Clone data to prevent prototype pollution
      callback(structuredClone(progress));
    };

    ipcRenderer.on('tts:setup-progress', handler);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('tts:setup-progress', handler);
    };
  },
};

// Expose API to renderer via contextBridge
// This is the ONLY way renderer can communicate with main process
contextBridge.exposeInMainWorld('ttsAPI', ttsAPI);
