/**
 * Whether a link leaves the wiki and should therefore open in a new tab.
 *
 * Any absolute URL counts as external. Internal wiki links are written as
 * root-relative or relative paths, so comparing against the current origin would
 * only matter for a hand-written absolute link back to the site — and that
 * comparison differs between prerender and the browser, which would cause a
 * hydration mismatch. In-page anchors and relative paths stay in the same tab.
 */
export function isExternalLink(href: string | undefined): boolean {
    if (!href) return false

    const trimmed = href.trim()
    if (!trimmed || trimmed.startsWith('#')) return false

    // mailto:, tel: and similar are handed to another app, so they behave like
    // leaving the site as well.
    if (/^(mailto|tel|sms|ftp):/i.test(trimmed)) return true

    // Absolute (https://…) or protocol-relative (//…).
    return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(trimmed)
}
