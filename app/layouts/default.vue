<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { theme, toggle } = useTheme()

// Prevent flash of wrong theme: runs before paint, corrects class if user prefers light
useHead({
  script: [
    {
      innerHTML: `(function(){try{var t=localStorage.getItem('ratio-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.style.backgroundColor='#f8f9fc';var m=document.querySelector('meta[name="color-scheme"]');if(m)m.content='light'}}catch(e){}})()`,
    },
  ],
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/60">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center">
          <img src="/logo.png" alt="Ratio" class="h-14 w-auto -my-3 -ml-3 -mr-1" />
          <span class="hidden sm:inline text-xs font-medium text-surface-400 bg-surface-700 px-2 py-0.5 rounded-md">
            Kalkulator B2B
          </span>
        </div>
        <div class="flex items-center gap-3">
          <!-- Theme toggle -->
          <button
            class="text-surface-400 hover:text-surface-200 transition-colors p-1.5"
            :title="theme === 'dark' ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'"
            @click="toggle"
          >
            <!-- Sun icon (shown in dark mode → click for light) -->
            <svg v-if="theme === 'dark'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <!-- Moon icon (shown in light mode → click for dark) -->
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          <!-- GitHub link -->
          <a
            href="https://github.com/whoisarjen/ratio"
            target="_blank"
            rel="noopener"
            class="text-surface-400 hover:text-surface-200 transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-surface-700/60 bg-surface-900">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-surface-400">
            {{ new Date().getFullYear() }} ratio &mdash; open source B2B tax calculator
          </p>
          <p class="text-xs text-surface-500">
            Informacje orientacyjne. Skonsultuj z doradca podatkowym.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
