import type { Notebook } from './types'

export type SearchResultType = 'page' | 'text'

export interface SearchResult {
  /** Unique identifier for the search item */
  id: string
  /** 'page' for page title match, 'text' for text element match */
  type: SearchResultType
  /** Page ID where match occurred */
  pageId: string
  /** 0-based page index */
  pageIndex: number
  /** Title of the page */
  pageTitle: string
  /** Text preview / snippet showing context of the match */
  snippet: string
  /** Element ID if matched a text element */
  elementId?: string
}

/**
 * Searches across page titles and text elements across all pages in a notebook.
 * Returns an array of search results ordered by page index.
 */
export function searchNotebook(notebook: Notebook, query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const results: SearchResult[] = []

  notebook.pages.forEach((page, pageIndex) => {
    // 1. Check page title match
    const title = page.title || `Page ${pageIndex + 1}`
    if (title.toLowerCase().includes(trimmed)) {
      results.push({
        id: `page-title-${page.id}`,
        type: 'page',
        pageId: page.id,
        pageIndex,
        pageTitle: title,
        snippet: title
      })
    }

    // 2. Check text elements in the page's scene
    const elements = (page.scene?.elements ?? []) as Array<Record<string, unknown>>
    for (const el of elements) {
      if (el.isDeleted) continue
      if (el.type === 'text' && typeof el.text === 'string' && el.text.trim()) {
        const textContent = el.text
        const textLower = textContent.toLowerCase()
        const matchIdx = textLower.indexOf(trimmed)
        if (matchIdx !== -1) {
          // Extract a context snippet around the match
          const start = Math.max(0, matchIdx - 25)
          const end = Math.min(textContent.length, matchIdx + trimmed.length + 35)
          let snippet = textContent.slice(start, end).replace(/\s+/g, ' ')
          if (start > 0) snippet = '...' + snippet
          if (end < textContent.length) snippet = snippet + '...'

          results.push({
            id: `text-${page.id}-${String(el.id)}`,
            type: 'text',
            pageId: page.id,
            pageIndex,
            pageTitle: title,
            snippet,
            elementId: typeof el.id === 'string' ? el.id : undefined
          })
        }
      }
    }
  })

  return results
}
