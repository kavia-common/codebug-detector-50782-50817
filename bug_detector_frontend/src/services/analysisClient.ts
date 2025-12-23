import { appConfig } from '../config/config';

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface AnalysisFinding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  lineStart: number;
  lineEnd: number;
  rule: string;
  recommendation: string;
}

export interface AnalysisSummary {
  total: number;
  bySeverity: Record<Severity, number>;
}

export interface AnalysisResponse {
  findings: AnalysisFinding[];
  summary: AnalysisSummary;
  error?: {
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
  };
}

type FetchLike = typeof fetch;

/**
 * Internal: compute a summary for a set of findings.
 */
function summarize(findings: AnalysisFinding[]): AnalysisSummary {
  const base: Record<Severity, number> = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const f of findings) {
    if (base[f.severity] !== undefined) base[f.severity] += 1;
  }
  return {
    total: findings.length,
    bySeverity: base,
  };
}

/**
 * Internal: timeout wrapper for fetch.
 */
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeoutMs = 12000, _fetch: FetchLike = fetch): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await _fetch(resource, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Internal: normalize backend response to AnalysisResponse.
 * Accepts a payload that may already be in normalized shape or requires mapping.
 */
function normalizeResponse(payload: any): AnalysisResponse {
  if (!payload) {
    return {
      findings: [],
      summary: { total: 0, bySeverity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 } },
      error: { message: 'Empty response received from server' },
    };
  }

  // If already in the expected shape, trust but verify minimally.
  if (Array.isArray(payload.findings)) {
    const findings = payload.findings.map(mapFinding);
    return {
      findings,
      summary: payload.summary && typeof payload.summary === 'object'
        ? {
            total: Number(payload.summary.total ?? findings.length),
            bySeverity: {
              info: Number(payload.summary.bySeverity?.info ?? 0),
              low: Number(payload.summary.bySeverity?.low ?? 0),
              medium: Number(payload.summary.bySeverity?.medium ?? 0),
              high: Number(payload.summary.bySeverity?.high ?? 0),
              critical: Number(payload.summary.bySeverity?.critical ?? 0),
            },
          }
        : summarize(findings),
    };
  }

  // If backend returns different keys, try best-effort mapping
  const rawFindings = (payload.issues || payload.results || payload.findings || []) as any[];
  const findings = Array.isArray(rawFindings) ? rawFindings.map(mapFinding) : [];
  return {
    findings,
    summary: summarize(findings),
  };
}

/**
 * Internal: map a single raw finding into the AnalysisFinding shape.
 */
function mapFinding(raw: any): AnalysisFinding {
  const sev = (String(raw?.severity || raw?.level || 'info').toLowerCase() as Severity);
  const valid: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];
  const severity: Severity = valid.includes(sev) ? sev : 'info';

  const ls = Number(raw?.lineStart ?? raw?.line ?? 1);
  const le = Number(raw?.lineEnd ?? raw?.endLine ?? ls);

  return {
    id: String(raw?.id ?? raw?.ruleId ?? raw?.rule ?? cryptoLikeRandomId()),
    title: String(raw?.title ?? raw?.message ?? 'Finding'),
    description: String(raw?.description ?? raw?.detail ?? raw?.message ?? ''),
    severity,
    lineStart: Number.isFinite(ls) && ls > 0 ? ls : 1,
    lineEnd: Number.isFinite(le) && le >= (Number.isFinite(ls) ? ls : 1) ? le : (Number.isFinite(ls) ? ls : 1),
    rule: String(raw?.rule ?? raw?.ruleId ?? 'N/A'),
    recommendation: String(raw?.recommendation ?? raw?.suggestion ?? 'Review the related code and apply best practices to address this finding.'),
  };
}

/**
 * Internal: safe ID generator usable in browsers without crypto random UUID.
 */
function cryptoLikeRandomId(): string {
  try {
    // Prefer crypto if available
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  // Fallback
  return 'f_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Create a mock analysis response for demo mode or as a fallback.
 */
function mockAnalyze(snippet: string, language: string): AnalysisResponse {
  const trimmed = (snippet || '').trim();
  const baseFindings: AnalysisFinding[] = [];

  // Very lightweight heuristics for demo flair
  if (!trimmed) {
    // No code -> no findings
  } else {
    if (trimmed.toLowerCase().includes('todo')) {
      baseFindings.push({
        id: cryptoLikeRandomId(),
        title: 'TODO present in code',
        description: 'A TODO comment is present; unresolved tasks may indicate incomplete logic.',
        severity: 'info',
        lineStart: 1,
        lineEnd: 1,
        rule: 'style/todo-comment',
        recommendation: 'Create an issue and track a clear action item or address the TODO before release.',
      });
    }
    if (/\beval\s*\(/.test(trimmed)) {
      baseFindings.push({
        id: cryptoLikeRandomId(),
        title: 'Use of eval detected',
        description: 'The use of eval can introduce security vulnerabilities and should be avoided.',
        severity: 'high',
        lineStart: 1,
        lineEnd: 1,
        rule: 'security/no-eval',
        recommendation: 'Refactor code to avoid eval; use safer alternatives such as JSON parsing or function mappings.',
      });
    }
    if (/password\s*=\s*["'`].+["'`]/i.test(trimmed)) {
      baseFindings.push({
        id: cryptoLikeRandomId(),
        title: 'Hardcoded secret detected',
        description: 'Potential hardcoded credential or secret found.',
        severity: 'critical',
        lineStart: 1,
        lineEnd: 1,
        rule: 'security/no-hardcoded-secrets',
        recommendation: 'Remove secrets from code and load from secure environment variables or a secret manager.',
      });
    }
    if (language.toLowerCase().includes('js') && /\bvar\b/.test(trimmed)) {
      baseFindings.push({
        id: cryptoLikeRandomId(),
        title: 'var usage',
        description: 'Use of var can lead to unexpected hoisting behavior.',
        severity: 'low',
        lineStart: 1,
        lineEnd: 1,
        rule: 'style/no-var',
        recommendation: 'Prefer let or const for block-scoped declarations.',
      });
    }
  }

  const findings = baseFindings.length ? baseFindings : [
    {
      id: cryptoLikeRandomId(),
      title: 'No issues detected in mock mode',
      description: 'Mock analysis did not find notable issues. Run against a connected backend for full analysis.',
      severity: 'info',
      lineStart: 1,
      lineEnd: 1,
      rule: 'mock/none',
      recommendation: 'Proceed, or integrate with the backend for deeper analysis.',
    },
  ];

  return {
    findings,
    summary: summarize(findings),
  };
}

// PUBLIC_INTERFACE
export async function analyze(snippet: string, language: string): Promise<AnalysisResponse> {
  /** Analyze a code snippet for potential bugs and issues.
   *
   * In connected mode (apiBase configured), this calls POST {apiBase}/analyze
   * with body { snippet, language } and returns a normalized AnalysisResponse.
   * In demo mode, returns a mock AnalysisResponse suitable for the UI.
   */
  const { apiBase, isDemo } = appConfig;

  // If we are explicitly in demo mode or no apiBase provided, return mock
  if (!apiBase || isDemo) {
    return mockAnalyze(snippet, language);
  }

  const url = `${apiBase}/analyze`;

  try {
    const resp = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ snippet, language }),
    }, 15000);

    const contentType = resp.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!resp.ok) {
      // Attempt to get server-provided error body for context
      let serverErr: any = undefined;
      try {
        serverErr = isJson ? await resp.json() : await resp.text();
      } catch {
        // ignore parsing errors
      }
      return {
        findings: [],
        summary: { total: 0, bySeverity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 } },
        error: {
          message: mapHttpErrorMessage(resp.status),
          status: resp.status,
          details: serverErr,
        },
      };
    }

    const data = isJson ? await resp.json() : await safeParseTextAsJson(await resp.text());
    return normalizeResponse(data);
  } catch (err: any) {
    // Handle network errors & aborts
    const isAbort = err?.name === 'AbortError';
    return {
      findings: [],
      summary: { total: 0, bySeverity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 } },
      error: {
        message: isAbort ? 'Request timed out. Please try again.' : 'Network error occurred while contacting the analysis service.',
        code: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
        details: processErrorDetails(err),
      },
    };
  }
}

/**
 * Attempt to parse text as JSON; fallback to a basic envelope if parsing fails.
 */
function safeParseTextAsJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { findings: [], raw: text };
  }
}

/**
 * Map HTTP status to user-friendly messages.
 */
function mapHttpErrorMessage(status: number): string {
  if (status === 400) return 'Invalid request. Please check your input and try again.';
  if (status === 401) return 'Unauthorized. Please check your credentials or API access.';
  if (status === 403) return 'Forbidden. Your account does not have access to this resource.';
  if (status === 404) return 'Service endpoint not found. Please verify the API base URL.';
  if (status === 408) return 'Request timeout. Please try again.';
  if (status >= 500 && status < 600) return 'Server error while analyzing code. Please try again later.';
  return `Unexpected error (HTTP ${status}).`;
}

/**
 * Extract useful info from an unknown error for diagnostics without exposing internals.
 */
function processErrorDetails(err: unknown): unknown {
  if (err && typeof err === 'object') {
    const anyErr = err as any;
    return {
      name: anyErr.name,
      message: anyErr.message,
      stack: anyErr.stack ? String(anyErr.stack).split('\n').slice(0, 3).join('\n') : undefined,
    };
  }
  return { message: String(err) };
}
