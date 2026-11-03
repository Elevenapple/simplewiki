/**
 * Highlights occurrences of search terms inside a DOM subtree.
 *
 * Uses the CSS Custom Highlight API when available, which paints over the text
 * without touching the DOM. Older browsers fall back to wrapping matches in
 * <mark> elements. Either way the returned function removes the highlight again.
 */

export const HIGHLIGHT_NAME = 'search-hit'

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'SVG', 'MARK'])

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseTerms(raw: unknown): string[] {
    if (typeof raw !== 'string') return []
    const seen = new Set<string>()
    return raw
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length >= 2)
        .filter(t => {
            const k = t.toLowerCase()
            if (seen.has(k)) return false
            seen.add(k)
            return true
        })
        .slice(0, 8)
}

function textNodes(root: Node): Text[] {
    const out: Text[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = (node as Text).parentElement
            if (!parent) return NodeFilter.FILTER_REJECT
            for (let el: HTMLElement | null = parent; el && el !== root; el = el.parentElement) {
                if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT
                if (el.dataset.noHighlight !== undefined) return NodeFilter.FILTER_REJECT
            }
            return (node as Text).data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        },
    })
    let n: Node | null
    while ((n = walker.nextNode())) out.push(n as Text)
    return out
}

export interface HighlightResult {
    /** Scroll target for the first match, or null when nothing matched. */
    first: Range | Element | null
    count: number
    clear: () => void
}

export function highlightTerms(root: HTMLElement, terms: string[]): HighlightResult {
    const none: HighlightResult = { first: null, count: 0, clear: () => {} }
    if (!terms.length) return none

    const pattern = new RegExp(terms.map(escapeRegExp).join('|'), 'gi')
    const nodes = textNodes(root)

    const highlightApi = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof (globalThis as any).Highlight === 'function'

    if (highlightApi) {
        const ranges: Range[] = []
        for (const node of nodes) {
            pattern.lastIndex = 0
            let m: RegExpExecArray | null
            while ((m = pattern.exec(node.data))) {
                const r = document.createRange()
                r.setStart(node, m.index)
                r.setEnd(node, m.index + m[0].length)
                ranges.push(r)
                if (m[0].length === 0) pattern.lastIndex++
            }
        }
        if (!ranges.length) return none
        const hl = new (globalThis as any).Highlight(...ranges)
        ;(CSS as any).highlights.set(HIGHLIGHT_NAME, hl)
        return {
            first: ranges[0]!,
            count: ranges.length,
            clear: () => (CSS as any).highlights.delete(HIGHLIGHT_NAME),
        }
    }

    // Fallback: wrap matches in <mark>.
    const marks: HTMLElement[] = []
    for (const node of nodes) {
        pattern.lastIndex = 0
        if (!pattern.test(node.data)) continue
        pattern.lastIndex = 0

        const frag = document.createDocumentFragment()
        let last = 0
        let m: RegExpExecArray | null
        while ((m = pattern.exec(node.data))) {
            if (m.index > last) frag.appendChild(document.createTextNode(node.data.slice(last, m.index)))
            const mark = document.createElement('mark')
            mark.className = HIGHLIGHT_NAME
            mark.textContent = m[0]
            frag.appendChild(mark)
            marks.push(mark)
            last = m.index + m[0].length
            if (m[0].length === 0) pattern.lastIndex++
        }
        if (last < node.data.length) frag.appendChild(document.createTextNode(node.data.slice(last)))
        node.parentNode?.replaceChild(frag, node)
    }
    if (!marks.length) return none

    return {
        first: marks[0]!,
        count: marks.length,
        clear: () => {
            for (const mark of marks) {
                const parent = mark.parentNode
                if (!parent) continue
                parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark)
                parent.normalize()
            }
        },
    }
}
