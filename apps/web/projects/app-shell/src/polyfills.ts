/**
 * Angular Polyfills
 */

// Define ngDevMode to prevent ReferenceError in dev mode with some builders
(window as any).ngDevMode = (window as any).ngDevMode || false;

// Ensure global is defined if some libraries expect it
(window as any).global = window;
