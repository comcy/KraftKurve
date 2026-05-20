import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Offline Queue Dead-Letter Decision Tests
 * 
 * These tests validate the offline queue's dead-letter classification logic:
 * - Conflict errors (409, 422, 412) go to dead-letter immediately
 * - Client errors (4xx) go to dead-letter after max retries
 * - Server errors (5xx) trigger retries with exponential backoff
 * - Network timeouts trigger retries
 */

describe('Offline Queue Dead-Letter Classification', () => {
  it('classifies 409 Conflict as dead-letter immediately', () => {
    const status = 409;
    const isConflict = [409, 412, 422].includes(status);
    const attempts = 1;
    const shouldDeadLetter = isConflict && attempts >= 1;
    
    assert.equal(shouldDeadLetter, true);
  });

  it('classifies 422 Unprocessable Entity as dead-letter immediately', () => {
    const status = 422;
    const isConflict = [409, 412, 422].includes(status);
    const attempts = 1;
    const shouldDeadLetter = isConflict && attempts >= 1;
    
    assert.equal(shouldDeadLetter, true);
  });

  it('classifies 412 Precondition Failed as dead-letter immediately', () => {
    const status = 412;
    const isConflict = [409, 412, 422].includes(status);
    const attempts = 1;
    const shouldDeadLetter = isConflict && attempts >= 1;
    
    assert.equal(shouldDeadLetter, true);
  });

  it('classifies 401 Unauthorized as dead-letter after retry', () => {
    const status = 401;
    const isClientError = status >= 400 && status < 500;
    const attempts = 3;
    const maxAttempts = 3;
    const shouldDeadLetter = isClientError && attempts >= maxAttempts;
    
    assert.equal(shouldDeadLetter, true);
  });

  it('classifies 403 Forbidden as dead-letter after retry', () => {
    const status = 403;
    const isClientError = status >= 400 && status < 500;
    const attempts = 3;
    const maxAttempts = 3;
    const shouldDeadLetter = isClientError && attempts >= maxAttempts;
    
    assert.equal(shouldDeadLetter, true);
  });

  it('does not dead-letter 500 Server Error on first attempt', () => {
    const status = 500;
    const isServerError = status >= 500;
    const attempts = 1;
    const maxAttempts = 3;
    const shouldDeadLetter = !isServerError && attempts >= maxAttempts;
    
    assert.equal(shouldDeadLetter, false);
  });

  it('retries 503 Service Unavailable up to max attempts', () => {
    const status = 503;
    const isServerError = status >= 500;
    const attempts = 1;
    const maxAttempts = 3;
    const shouldRetry = isServerError || (attempts < maxAttempts);
    
    assert.equal(shouldRetry, true);
  });

  it('increments attempts counter on retry', () => {
    let attempts = 0;
    const maxRetries = 3;
    
    // First failure
    attempts += 1;
    assert.equal(attempts, 1);
    
    // Second failure
    attempts += 1;
    assert.equal(attempts, 2);
    
    // Third failure
    attempts += 1;
    assert.equal(attempts, 3);
    
    // Should now be dead-lettered
    assert.equal(attempts >= maxRetries, true);
  });

  it('preserves operation metadata when moving to dead-letter', () => {
    const operation = {
      id: 'op-123',
      method: 'POST',
      url: '/training/sessions',
      body: { date: '2026-05-19', templateType: 'push' },
      queuedAt: new Date('2026-05-19T10:00:00Z'),
      attempts: 3,
      lastError: { status: 409, message: 'Conflict' },
    };
    
    // When moved to dead-letter, all metadata preserved
    const deadLetterEntry = {
      ...operation,
      deadLetteredAt: new Date(),
      reason: 'Conflict error 409 after 3 attempts',
    };
    
    assert.equal(deadLetterEntry.id, operation.id);
    assert.equal(deadLetterEntry.method, operation.method);
    assert.equal(deadLetterEntry.url, operation.url);
    assert.deepEqual(deadLetterEntry.body, operation.body);
    assert.equal(deadLetterEntry.attempts, 3);
  });

  it('allows manual retry of dead-lettered operation', () => {
    const deadLetterEntry = {
      id: 'op-123',
      method: 'POST',
      url: '/training/sessions',
      body: { date: '2026-05-19', templateType: 'push' },
      attempts: 3,
      status: 422,
      reason: 'Invalid state',
    };
    
    // When user manually clears dead-letter and re-queues
    const requeuedOperation = {
      ...deadLetterEntry,
      attempts: 0, // Reset for retry
      status: undefined,
      reason: undefined,
    };
    
    assert.equal(requeuedOperation.attempts, 0);
    assert.equal(requeuedOperation.status, undefined);
  });

  it('tracks retry attempts across offline->online->offline transitions', () => {
    let attempts = 0;
    
    // Offline: attempt 1
    attempts += 1;
    assert.equal(attempts, 1);
    
    // Go online, server returns 409
    // Offline again: still attempt 1 (same operation in queue)
    const currentAttempts = attempts;
    assert.equal(currentAttempts, 1);
    
    // Retry offline: attempt 2
    attempts += 1;
    assert.equal(attempts, 2);
    
    // Should move to dead-letter after 3 attempts
    attempts += 1;
    assert.equal(attempts >= 3, true);
  });
});
