<script setup lang="ts">
const TARGET_ID = 'main-content'

// Moves focus as well as the scroll position: following the href alone leaves the
// keyboard focus in the header on some browsers, which defeats the point.
function skip(e: MouseEvent | KeyboardEvent) {
    e.preventDefault()
    const el = document.getElementById(TARGET_ID)
    if (!el) return
    el.focus()
    el.scrollIntoView({ block: 'start' })
}
</script>

<template>
    <a :href="`#${TARGET_ID}`" class="skip-link print:hidden" @click="skip">
        Skip to content
    </a>
</template>

<style scoped>
.skip-link {
    position: absolute;
    left: 8px;
    top: 8px;
    z-index: 1000;
    /* Off-screen until focused, rather than display:none, so it stays tabbable. */
    transform: translateY(-200%);
    padding: 7px 12px;
    background: var(--color-content-bg);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    color: var(--color-link);
    font-family: var(--font-body);
    font-size: 13px;
    text-decoration: none;
    transition: transform 0.12s ease-out;
}

.skip-link:focus {
    transform: translateY(0);
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
    .skip-link {
        transition: none;
    }
}
</style>
