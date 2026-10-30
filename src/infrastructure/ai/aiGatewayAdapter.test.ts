import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleGenAiGatewayAdapter } from './aiGatewayAdapter';

test('GoogleGenAiGatewayAdapter safely reports unconfigured when no API key is present', async () => {
  const adapter = new GoogleGenAiGatewayAdapter(null);

  assert.equal(adapter.isConfigured(), false);
  const result = await adapter.callWithTimeout('Hello', 100);
  assert.equal(result, null);
});
