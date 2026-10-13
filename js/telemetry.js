// ========================================================
//  KhaylimTech — Telemetry, Rate Limiting & Error Tracking
//  Protects billings, tracks funnel drop-offs, and shields
//  users from raw stack traces.
// ========================================================

(function () {
  'use strict';

  // 1. Rate Limiting Controller (Token-Bucket & Action Throttle)
  const actionTimestamps = {};

  window.KhaylimGuard = {
    // Check if an action is allowed based on minimum cooldown (ms)
    allowAction: function (actionKey, cooldownMs = 600) {
      const now = Date.now();
      const last = actionTimestamps[actionKey] || 0;
      if (now - last < cooldownMs) {
        return false; // Throttled
      }
      actionTimestamps[actionKey] = now;
      return true;
    },

    // Debounce a high-frequency function (e.g. search input)
    debounce: function (fn, waitMs = 300) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), waitMs);
      };
    },

    // Throttle an event handler
    throttle: function (fn, waitMs = 500) {
      let lastTime = 0;
      return function (...args) {
        const now = Date.now();
        if (now - lastTime >= waitMs) {
          lastTime = now;
          fn.apply(this, args);
        }
      };
    }
  };

  // 2. Error Shield & Tracking (No Stack Trace Leaks)
  const ERROR_LOG_KEY = 'khaylim_error_telemetry';
  const MAX_STORED_ERRORS = 25;

  window.KhaylimTelemetry = {
    logError: function (errorSource, errorObj) {
      const errorMsg = (errorObj && errorObj.message) ? errorObj.message : String(errorObj || 'Unknown error');
      
      // Sanitize: strip out Firebase API keys, database paths, or long stack traces
      const sanitizedMsg = errorMsg
        .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
        .replace(/(?:projects|databases)\/[^\s\/]+/g, '[REDACTED_PATH]');

      const logEntry = {
        timestamp: new Date().toISOString(),
        source: errorSource,
        message: sanitizedMsg,
        url: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 120)
      };

      try {
        const stored = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
        stored.unshift(logEntry);
        if (stored.length > MAX_STORED_ERRORS) stored.pop();
        localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(stored));
      } catch (e) {
        // Storage disabled / private browsing
      }

      // If store owner configured a remote webhook or Sentry in window.KHAYLIM_ERROR_WEBHOOK
      if (window.KHAYLIM_ERROR_WEBHOOK) {
        try {
          fetch(window.KHAYLIM_ERROR_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry),
            mode: 'no-cors'
          }).catch(() => {});
        } catch (_) {}
      }
    },

    // Get sanitized user-facing friendly message
    getUserFriendlyMessage: function (err) {
      if (!err) return "An unexpected error occurred. Please try again.";
      const msg = (err.message || String(err)).toLowerCase();

      if (msg.includes('network') || msg.includes('offline') || msg.includes('failed to fetch')) {
        return "Network connection lost. Please check your internet connection.";
      }
      if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('denied')) {
        return "Access denied. Please ensure you are signed in with an authorized account.";
      }
      if (msg.includes('not-found') || msg.includes('does not exist')) {
        return "The requested item could not be found.";
      }
      if (msg.includes('quota') || msg.includes('resource-exhausted')) {
        return "Service is experiencing high traffic. Please try again in a few moments.";
      }
      return "Something went wrong while processing your request. Please try again.";
    }
  };

  // Global uncaught error listeners
  window.addEventListener('error', function (event) {
    window.KhaylimTelemetry.logError('uncaught_error', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', function (event) {
    window.KhaylimTelemetry.logError('unhandled_promise', event.reason);
  });

  // 3. Ecommerce Drop-off Funnel Analytics
  const FUNNEL_LOG_KEY = 'khaylim_funnel_analytics';

  window.KhaylimAnalytics = {
    track: function (eventName, eventData = {}) {
      const payload = {
        event: eventName,
        data: eventData,
        timestamp: new Date().toISOString(),
        path: window.location.pathname
      };

      // 1. Forward to Google Analytics 4 if gtag exists
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventData);
      }

      // 2. Persist to local analytics log for owner review in Admin portal
      try {
        const existing = JSON.parse(localStorage.getItem(FUNNEL_LOG_KEY) || '[]');
        existing.unshift(payload);
        if (existing.length > 50) existing.pop();
        localStorage.setItem(FUNNEL_LOG_KEY, JSON.stringify(existing));
      } catch (e) {}

      // 3. Trigger custom event for app components
      window.dispatchEvent(new CustomEvent('khaylim:analytics', { detail: payload }));
    }
  };

  // Automatically track initial page load
  window.KhaylimAnalytics.track('page_view', {
    title: document.title,
    referrer: document.referrer || 'direct'
  });

})();
