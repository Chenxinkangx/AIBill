const MAX_TAGS_PER_RECORD = 3
const MIN_TAG_LENGTH = 2
const MAX_TAG_LENGTH = 8

export function normalizeTagName(value: unknown): string | null {
  const name = String(value ?? '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '')
  const length = Array.from(name).length
  if (length < MIN_TAG_LENGTH || length > MAX_TAG_LENGTH) return null
  return name
}

export function normalizeTagNames(values: unknown[], limit = MAX_TAGS_PER_RECORD): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const name = normalizeTagName(value)
    if (!name || seen.has(name)) continue
    seen.add(name)
    result.push(name)
    if (result.length >= limit) break
  }
  return result
}
