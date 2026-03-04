// lib/web-tools.ts - Web utilities stub

// Stub implementations for build compatibility
export async function web_search(query: string) {
  console.warn('web_search called but not implemented in browser environment');
  return { results: [] };
}

export async function web_fetch(url: string) {
  console.warn('web_fetch called but not implemented in browser environment');
  return { content: '', error: 'Not available in browser' };
}