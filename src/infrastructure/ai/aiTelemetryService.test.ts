import test from 'node:test';
import assert from 'node:assert/strict';
import { AiTelemetryService } from './aiTelemetryService';

test('AiTelemetryService tracks usage, cache hits, and enforces budget kill-switch', () => {
  const service = new AiTelemetryService();

  // Initial stats
  const initial = service.getStats();
  assert.equal(initial.totalRequests, 14);
  assert.equal(initial.killSwitchActive, false);

  // Availability check passes
  const avail = service.isAvailable();
  assert.equal(avail.available, true);

  // Kill switch activates
  service.setKillSwitch(true);
  const blocked = service.isAvailable();
  assert.equal(blocked.available, false);
  assert.match(blocked.reason || '', /kill switch/i);

  // Reset kill switch
  service.setKillSwitch(false);
  assert.equal(service.isAvailable().available, true);

  // Record usage (cache miss)
  service.recordUsage('TEST_TASK', 1000, 500, false);
  const updated = service.getStats();
  assert.equal(updated.totalRequests, 15);
  assert.equal(updated.cacheMisses, 15);
  assert.equal(updated.totalInputTokens, initial.totalInputTokens + 1000);

  // Caching
  service.setCachedResult('cache-key-1', { status: 'OK' });
  const cached = service.getCachedResult<{ status: string }>('cache-key-1');
  assert.ok(cached);
  assert.equal(cached?.status, 'OK');

  // Record cache hit
  service.recordUsage('TEST_TASK', 500, 200, true);
  assert.equal(service.getStats().cacheHits, 7);
});
