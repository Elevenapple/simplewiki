/**
 * Reading-time estimate derived from a Nuxt Content body AST.
 *
 * Code blocks are skipped: these pages carry long sample blocks that would
 * inflate the estimate well past the time spent actually reading the prose.
 */

const WORDS_PER_MINUTE = 200

type AnyNode = any

function tagOf(node: AnyNode): string | undefined {
    if (Array.isArray(node)) return typeof node[0] === 'string' ? node[0] : undefined
    return node?.tag ?? node?.type
}

function childrenOf(node: AnyNode): AnyNode[] {
    if (Array.isArray(node)) return node.slice(2)
    return node?.children ?? []
}

function propsOf(node: AnyNode): Record<string, any> {
    if (Array.isArray(node)) return (typeof node[1] === 'object' && node[1]) || {}
    return node?.props ?? {}
}

function rootNodes(body: AnyNode): AnyNode[] {
    if (!body) return []
    if (Array.isArray(body)) return body
    return body.value ?? body.children ?? []
}

/** Words in the prose, ignoring code blocks. */
export function countWords(body: AnyNode): number {
    let words = 0

    const walk = (nodes: AnyNode[]) => {
        for (const node of nodes) {
            if (typeof node === 'string') {
                const trimmed = node.trim()
                if (trimmed) words += trimmed.split(/\s+/).length
                continue
            }
            if (node?.type === 'text' && typeof node.value === 'string') {
                const trimmed = node.value.trim()
                if (trimmed) words += trimmed.split(/\s+/).length
                continue
            }
            const tag = tagOf(node)
            if (tag === 'pre' || tag === 'code') continue
            walk(childrenOf(node))
        }
    }

    walk(rootNodes(body))
    return words
}

/** Minutes to read, rounded up, never below one. */
export function readingMinutes(body: AnyNode): number {
    return Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE)) || 1
}

/**
 * Id of the first h1, so the note can be attached to the page title only —
 * several pages use further h1s further down.
 */
export function firstHeadingId(body: AnyNode): string | null {
    for (const node of rootNodes(body)) {
        if (typeof node === 'string') continue
        if (tagOf(node) === 'h1') return propsOf(node).id ?? null
    }
    return null
}
