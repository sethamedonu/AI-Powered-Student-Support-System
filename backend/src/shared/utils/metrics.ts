/**
 * Embedded Metrics Format (EMF) publisher.
 * Writes structured JSON to stdout — CloudWatch Logs agent parses it into metrics automatically.
 * Zero SDK calls, zero latency overhead, zero cost beyond log ingestion.
 */

interface MetricDefinition {
  name: string;
  unit:
    | 'Count'
    | 'Milliseconds'
    | 'Seconds'
    | 'Bytes'
    | 'Percent'
    | 'None';
  value: number;
}

interface EMFPayload {
  _aws: {
    Timestamp: number;
    CloudWatchMetrics: {
      Namespace: string;
      Dimensions: string[][];
      Metrics: { Name: string; Unit: string }[];
    }[];
  };
  [key: string]: unknown;
}

export function publishMetrics(
  namespace: string,
  dimensions: Record<string, string>,
  metrics: MetricDefinition[],
): void {
  const payload: EMFPayload = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: namespace,
          Dimensions: [Object.keys(dimensions)],
          Metrics: metrics.map(m => ({ Name: m.name, Unit: m.unit })),
        },
      ],
    },
    ...dimensions,
    ...Object.fromEntries(metrics.map(m => [m.name, m.value])),
  };

  // EMF requires stdout — CloudWatch Logs agent picks it up automatically
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

/** Convenience: emit a single AI invocation metric */
export function emitAIMetric(params: {
  model: string;
  latencyMs: number;
  tokensUsed: number;
  cacheHit: boolean;
  environment: string;
}): void {
  publishMetrics(
    'AISSS/AI',
    { Environment: params.environment, Model: params.model },
    [
      { name: 'Latency', unit: 'Milliseconds', value: params.latencyMs },
      { name: 'TokensUsed', unit: 'Count', value: params.tokensUsed },
      { name: 'CacheHit', unit: 'Count', value: params.cacheHit ? 1 : 0 },
      { name: 'AIInvocation', unit: 'Count', value: params.cacheHit ? 0 : 1 },
    ],
  );
}

/** Convenience: emit a Lambda cold start metric */
export function emitColdStart(functionName: string, environment: string): void {
  publishMetrics(
    'AISSS/Lambda',
    { Environment: environment, FunctionName: functionName },
    [{ name: 'ColdStart', unit: 'Count', value: 1 }],
  );
}
