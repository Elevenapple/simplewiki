<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  code?: string
  filename?: string
  language?: string
}>()

const isMermaid  = props.language === 'mermaid'
const isPlantUML = props.language === 'plantuml' || props.language === 'puml'
</script>

<template>
  <!-- Mermaid renders in the browser; PlantUML renders during prerender when it can,
       so it must not be confined to the client. -->
  <ClientOnly v-if="isMermaid">
    <MermaidDiagram><slot /></MermaidDiagram>
  </ClientOnly>

  <PlantumlDiagram v-else-if="isPlantUML" :code="code"><slot /></PlantumlDiagram>

  <div v-else class="code-wrapper">
    <div v-if="filename" class="code-header">
      <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
        <path d="M6 2h9l5 5v15H6V2z" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/>
        <path d="M15 2v6h6" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/>
      </svg>
      <span>{{ filename }}</span>
    </div>
    <pre v-bind="$attrs"><slot /></pre>
  </div>
</template>

<style lang="scss" scoped>
.code-wrapper {
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

.code-wrapper pre {
  margin: 0 !important;
  border-radius: 0 0 6px 6px !important;
}
</style>