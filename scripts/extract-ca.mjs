import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

// Proper JSON value extractor — handles nested structures and string contents
function extractJsonValue(str, from) {
  const opener = str[from]
  const closer = opener === '{' ? '}' : ']'
  let i = from, depth = 0, inString = false, escape = false
  while (i < str.length) {
    const c = str[i]
    if (escape) { escape = false; i++; continue }
    if (c === '\\' && inString) { escape = true; i++; continue }
    if (c === '"') { inString = !inString; i++; continue }
    if (inString) { i++; continue }
    if (c === opener) depth++
    else if (c === closer) { depth--; if (depth === 0) return str.slice(from, i + 1) }
    i++
  }
  return null
}

function findField(content, fromIdx, fieldName) {
  const marker = `${fieldName}: `
  const idx = content.indexOf(marker, fromIdx)
  if (idx < 0) return [null, fromIdx]
  const valueStart = idx + marker.length
  const firstChar = content[valueStart]
  if (firstChar !== '{' && firstChar !== '[') return [null, fromIdx]
  const raw = extractJsonValue(content, valueStart)
  if (!raw) return [null, fromIdx]
  return [JSON.parse(raw), valueStart + raw.length]
}

const files = [
  'profiles.ts',
  'profiles-part2.ts',
  'profiles-part3.ts',
  'profiles-part4.ts',
  'profiles-part5.ts',
  'profiles-part6.ts',
]

const employees = []

for (const fname of files) {
  const fpath = resolve(__dirname, '..', 'src', 'lib', 'employees', fname)
  const content = readFileSync(fpath, 'utf8')

  // find all slugs
  const slugRe = /slug:\s*'([^']+)'/g
  let m
  while ((m = slugRe.exec(content)) !== null) {
    const slug = m[1]
    const slugPos = m.index

    // find name field near slug
    const nameMatch = /name:\s*'([^']+)'/.exec(content.slice(slugPos, slugPos + 400))
    const name = nameMatch ? nameMatch[1] : slug

    // find characterCore after slug position
    const FIND = 'misdirects the person asking.'
    const findIdx = content.indexOf(FIND, slugPos)
    if (findIdx < 0) { console.warn(`  ✗ No FIND marker for ${slug}`); continue }
    const searchFrom = findIdx

    const [characterCore, p1] = findField(content, searchFrom, 'characterCore')
    const [watchPatterns, p2] = findField(content, p1, 'watchPatterns')
    const [kpis, p3] = findField(content, p2, 'kpis')
    const [autonomyModes] = findField(content, p3, 'autonomyModes')

    if (!characterCore || !watchPatterns || !kpis || !autonomyModes) {
      console.warn(`  ✗ Missing fields for ${slug}`)
      continue
    }

    employees.push({ slug, name, characterCore, watchPatterns, kpis, autonomyModes })
    console.log(`  ✓ ${slug}`)
  }
}

const outPath = resolve(__dirname, 'ca-data.json')
writeFileSync(outPath, JSON.stringify(employees, null, 2), 'utf8')
console.log(`\nExtracted ${employees.length} employees → scripts/ca-data.json`)
