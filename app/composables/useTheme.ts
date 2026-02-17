export function useTheme() {
  const theme = useState<'dark' | 'light'>('theme', () => 'dark')

  function apply(t: 'dark' | 'light') {
    if (import.meta.server) return
    document.documentElement.classList.toggle('dark', t === 'dark')
    document.documentElement.style.backgroundColor = t === 'dark' ? '#1a1c27' : '#f8f9fc'
    const meta = document.querySelector('meta[name="color-scheme"]')
    if (meta) meta.setAttribute('content', t)
    try {
      localStorage.setItem('ratio-theme', t)
    } catch {}
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  onMounted(() => {
    try {
      const saved = localStorage.getItem('ratio-theme')
      if (saved === 'light' || saved === 'dark') {
        theme.value = saved
      }
    } catch {}
    apply(theme.value)
  })

  watch(theme, apply)

  return { theme, toggle }
}
