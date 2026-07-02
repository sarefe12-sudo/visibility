// Small, dependency-free Markdown -> HTML converter for the subset of
// Markdown our AI content generators actually produce (H2/H3 headings, bold,
// links, bullet lists, tables, paragraphs). Good enough for publishing to
// WordPress/Ghost; not a general-purpose Markdown parser.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string): string {
  let out = escapeHtml(s)
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>')
  out = out.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
  out = out.replace(/`(.+?)`/g, '<code>$1</code>')
  return out
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  let listBuffer: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listBuffer.length && listType) {
      out.push(`<${listType}>${listBuffer.join('')}</${listType}>`)
    }
    listBuffer = []; listType = null
  }

  while (i < lines.length) {
    const line = lines[i]

    if (/^###\s+/.test(line)) { flushList(); out.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`); i++; continue }
    if (/^##\s+/.test(line)) { flushList(); out.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`); i++; continue }
    if (/^#\s+/.test(line)) { flushList(); out.push(`<h1>${inline(line.replace(/^#\s+/, ''))}</h1>`); i++; continue }

    if (/^\s*[-*]\s+/.test(line)) {
      if (listType !== 'ul') { flushList(); listType = 'ul' }
      listBuffer.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`)
      i++; continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== 'ol') { flushList(); listType = 'ol' }
      listBuffer.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`)
      i++; continue
    }

    if (line.trim() === '') { flushList(); i++; continue }

    // plain paragraph — accumulate until blank line
    flushList()
    const para: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,3}\s/.test(lines[i]) && !/^\s*[-*\d]/.test(lines[i])) {
      para.push(lines[i]); i++
    }
    out.push(`<p>${inline(para.join(' '))}</p>`)
  }
  flushList()

  return out.join('\n')
}
