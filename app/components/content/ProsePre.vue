<script lang="ts" setup>
import {ref} from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  code?: string
  filename?: string
  language?: string
}>()

const isMermaid  = props.language === 'mermaid'
const isPlantUML = props.language === 'plantuml' || props.language === 'puml'

const preRef = ref<HTMLPreElement | null>(null)
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copyCode() {
  // Nuxt Content supplies the raw block as `code`; fall back to the rendered text
  // for blocks where it is absent.
  const text = props.code ?? preRef.value?.textContent ?? ''
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard API is unavailable on insecure origins; select the block so the
    // reader can copy with the keyboard instead.
    if (preRef.value) {
      const range = document.createRange()
      range.selectNodeContents(preRef.value)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    return
  }
  copied.value = true
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <!-- Mermaid renders in the browser; PlantUML renders during prerender when it can,
       so it must not be confined to the client. -->
  <ClientOnly v-if="isMermaid">
    <MermaidDiagram><slot /></MermaidDiagram>
  </ClientOnly>

  <PlantumlDiagram v-else-if="isPlantUML" :code="code"><slot /></PlantumlDiagram>

  <div v-else :class="{ 'has-header': filename }" class="code-wrapper">
    <div v-if="filename" class="code-header">
      <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
        <path d="M6 2h9l5 5v15H6V2z" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/>
        <path d="M15 2v6h6" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/>
      </svg>
      <span class="code-filename">{{ filename }}</span>
    </div>

    <button
        :aria-label="copied ? 'Copied' : 'Copy code'"
        :class="{ copied }"
        :title="copied ? 'Copied' : 'Copy code'"
        class="copy-btn"
        type="button"
        @click="copyCode"
    >
      <svg v-if="copied" fill="none" height="13" viewBox="0 0 24 24" width="13">
        <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>
      </svg>
      <svg v-else fill="none" height="13" viewBox="0 0 24 24" width="13">
        <rect height="13" rx="2" stroke="currentColor" stroke-width="2" width="13" x="9" y="9"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-linecap="round" stroke-width="2"/>
      </svg>
      <span v-if="filename">{{ copied ? 'Copied' : 'Copy' }}</span>
    </button>

    <pre ref="preRef" v-bind="$attrs"><slot /></pre>
  </div>
</template>

<style lang="scss" scoped>
.code-wrapper {
  position: relative;
  margin: 16px 0;
}

.code-header {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px;
  background: var(--color-header-band);
  border: 1px solid var(--color-border-light);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 500;
}

.code-filename {
  // Leave room for the copy button on the right.
  padding-right: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-wrapper pre {
  margin: 0 !important;
  border-radius: 6px !important;
}

.has-header pre {
  border-radius: 0 0 6px 6px !important;
}

.copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 7px;
  background: var(--color-content-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  cursor: pointer;
  transition: opacity 0.15s, border-color 0.15s, color 0.15s;

  // Inside the header the button sits on the band; without a header it floats over
  // the code and is only revealed on hover or focus so it does not cover the text.
  .has-header & {
    top: 5px;
    right: 8px;
    background: transparent;
    border-color: transparent;
  }

  .code-wrapper:not(.has-header) & {
    opacity: 0;
  }

  .code-wrapper:not(.has-header):hover &,
  &:focus-visible {
    opacity: 1;
  }

  &:hover {
    border-color: var(--color-border);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 1px;
  }

  &.copied {
    color: #2e9e5b;
  }
}

@media (hover: none) {
  // Touch devices cannot hover; always show the button.
  .code-wrapper:not(.has-header) .copy-btn {
    opacity: 1;
  }
}
</style>
