export type LanguageOption = {
  value: string;
  label: string;
  group?: string;
};

export const DEFAULT_LANGUAGES: LanguageOption[] = [
  { value: 'javascript', label: 'JavaScript', group: 'Web' },
  { value: 'typescript', label: 'TypeScript', group: 'Web' },
  { value: 'python', label: 'Python', group: 'General' },
  { value: 'java', label: 'Java', group: 'General' },
  { value: 'csharp', label: 'C#', group: 'General' },
  { value: 'cpp', label: 'C/C++', group: 'Systems' },
  { value: 'go', label: 'Go', group: 'Systems' },
  { value: 'rust', label: 'Rust', group: 'Systems' },
  { value: 'ruby', label: 'Ruby', group: 'General' },
  { value: 'php', label: 'PHP', group: 'Web' },
  { value: 'kotlin', label: 'Kotlin', group: 'General' },
  { value: 'swift', label: 'Swift', group: 'General' },
  { value: 'shell', label: 'Shell', group: 'Systems' },
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Simple unique id helper to associate labels and inputs without collisions.
 */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}
