import { EventEmitter } from "events";

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  activeConnections: number;
  toolCalls: number;
  resourceAccess: number;
  timestamp: number;
}

interface PerformanceConfig {
  samplingInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private config: PerformanceConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private startTime = Date.now();

  constructor(config: Partial<PerformanceConfig> = {}) {
    super();
    this.config = {
      samplingInterval: 60000, // 1 minute
      retentionPeriod: 3600000, // 1 hour
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.1, // 10%
        memoryUsage: 512 * 1024 * 1024, // 512MB
      },
      ...config,
    };
  }

  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.samplingInterval);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  recordRequest(responseTime: number, isError = false): void {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }
    this.responseTimes.push(responseTime);

    // Keep only recent response times (last 1000 requests)
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  recordToolCall(): void {
    // Implementation for tracking tool calls
  }

  recordResourceAccess(): void {
    // Implementation for tracking resource access
  }

  private collectMetrics(): void {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate average response time
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) /
          this.responseTimes.length
        : 0;

    // Calculate throughput (requests per minute)
    const throughput = (this.requestCount / uptime) * 60000;

    // Calculate error rate
    const errorRate =
      this.requestCount > 0 ? this.errorCount / this.requestCount : 0;

    // Memory usage
    const memUsage = process.memoryUsage().heapUsed;

    const metrics: PerformanceMetrics = {
      responseTime: avgResponseTime,
      throughput,
      errorRate,
      memoryUsage: memUsage,
      activeConnections: 0, // Would need to be tracked separately
      toolCalls: 0,
      resourceAccess: 0,
      timestamp: now,
    };

    this.metrics.push(metrics);

    // Cleanup old metrics
    const cutoff = now - this.config.retentionPeriod;
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);

    // Check thresholds and emit alerts
    this.checkThresholds(metrics);

    this.emit("metrics", metrics);
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: string[] = [];

    if (metrics.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push(`High response time: ${metrics.responseTime.toFixed(2)}ms`);
    }

    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }

    if (metrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      alerts.push(
        `High memory usage: ${(metrics.memoryUsage / (1024 * 1024)).toFixed(
          2
        )}MB`
      );
    }

    if (alerts.length > 0) {
      this.emit("alert", {
        timestamp: metrics.timestamp,
        alerts,
        metrics,
      });
    }
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0
      ? this.metrics[this.metrics.length - 1]
      : null;
  }

  getMetricsHistory(since?: number): PerformanceMetrics[] {
    if (!since) {
      return [...this.metrics];
    }
    return this.metrics.filter((m) => m.timestamp >= since);
  }

  getSummary(): {
    uptime: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  } {
    const uptime = Date.now() - this.startTime;
    const averageResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) /
          this.responseTimes.length
        : 0;
    const errorRate =
      this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    const throughput = (this.requestCount / uptime) * 60000;

    return {
      uptime,
      totalRequests: this.requestCount,
      averageResponseTime,
      errorRate,
      throughput,
    };
  }
}
