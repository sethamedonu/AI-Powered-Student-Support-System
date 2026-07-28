import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { publishMetrics, emitAIMetric, emitColdStart } from '../../src/shared/utils/metrics.js';

describe('metrics publisher', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('publishMetrics', () => {
    it('writes valid EMF JSON to stdout', () => {
      publishMetrics(
        'AISSS/Test',
        { Environment: 'test' },
        [{ name: 'RequestCount', unit: 'Count', value: 1 }],
      );

      expect(consoleSpy).toHaveBeenCalledOnce();
      const payload = JSON.parse(consoleSpy.mock.calls[0]![0] as string);

      expect(payload._aws.CloudWatchMetrics[0].Namespace).toBe('AISSS/Test');
      expect(payload._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('RequestCount');
      expect(payload.RequestCount).toBe(1);
      expect(payload.Environment).toBe('test');
    });

    it('includes all dimension keys in the Dimensions array', () => {
      publishMetrics(
        'AISSS/Test',
        { Environment: 'dev', Model: 'nova-lite' },
        [{ name: 'Latency', unit: 'Milliseconds', value: 250 }],
      );

      const payload = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
      expect(payload._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('Environment');
      expect(payload._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('Model');
    });

    it('includes a valid Timestamp', () => {
      const before = Date.now();
      publishMetrics('NS', { Env: 'test' }, [{ name: 'X', unit: 'Count', value: 0 }]);
      const after = Date.now();

      const payload = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
      expect(payload._aws.Timestamp).toBeGreaterThanOrEqual(before);
      expect(payload._aws.Timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('emitAIMetric', () => {
    it('emits Latency, TokensUsed, CacheHit, and AIInvocation metrics', () => {
      emitAIMetric({ model: 'nova-lite', latencyMs: 300, tokensUsed: 150, cacheHit: false, environment: 'test' });

      const payload = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
      const metricNames = payload._aws.CloudWatchMetrics[0].Metrics.map((m: { Name: string }) => m.Name);

      expect(metricNames).toContain('Latency');
      expect(metricNames).toContain('TokensUsed');
      expect(metricNames).toContain('CacheHit');
      expect(metricNames).toContain('AIInvocation');
      expect(payload.Latency).toBe(300);
      expect(payload.TokensUsed).toBe(150);
    });

    it('sets CacheHit=1 and AIInvocation=0 on cache hit', () => {
      emitAIMetric({ model: 'nova-lite', latencyMs: 5, tokensUsed: 0, cacheHit: true, environment: 'test' });

      const payload = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
      expect(payload.CacheHit).toBe(1);
      expect(payload.AIInvocation).toBe(0);
    });

    it('sets CacheHit=0 and AIInvocation=1 on cache miss', () => {
      emitAIMetric({ model: 'nova-lite', latencyMs: 400, tokensUsed: 200, cacheHit: false, environment: 'test' });

      const payload = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
      expect(payload.CacheHit).toBe(0);
      expect(payload.AIInvocation).toBe(1);
    });
  });

  describe('emitColdStart', () => {
    it('emits ColdStart metric with value 1', () => {
      emitColdStart('aisss-dev-chat-sendMessage', 'development');

      const payload = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
      expect(payload.ColdStart).toBe(1);
      expect(payload.FunctionName).toBe('aisss-dev-chat-sendMessage');
      expect(payload._aws.CloudWatchMetrics[0].Namespace).toBe('AISSS/Lambda');
    });
  });
});
