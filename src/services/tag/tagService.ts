import { db } from '../../db/index'
import type { Tag } from '../../types'
import { generateId } from '../../utils/id'
import { normalizeTagName, normalizeTagNames } from './tagRules'

const TAG_COLORS = ['#DBEAFE', '#DCFCE7', '#FEF3C7', '#FCE7F3', '#EDE9FE', '#FFEDD5']

export async function createTag(name: string): Promise<Tag> {
  const trimmed = normalizeTagName(name)
  if (!trimmed) throw new Error('标签名称需要 2～8 个字')

  const duplicate = await db.tags
    .filter((tag) => tag.name === trimmed && !tag.archived)
    .first()
  if (duplicate) throw new Error('标签已存在')

  const tags = await db.tags.toArray()
  const order = tags.reduce((max, tag) => Math.max(max, tag.order), 0) + 1
  const now = new Date().toISOString()
  const tag: Tag = {
    id: generateId(),
    name: trimmed,
    color: TAG_COLORS[(order - 1) % TAG_COLORS.length],
    order,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.tags.add(tag)
  return tag
}

export async function renameTag(id: string, name: string): Promise<void> {
  const trimmed = normalizeTagName(name)
  if (!trimmed) throw new Error('标签名称需要 2～8 个字')
  const tag = await db.tags.get(id)
  if (!tag) throw new Error('标签不存在')
  const duplicate = await db.tags
    .filter((item) => item.id !== id && item.name === trimmed && !item.archived)
    .first()
  if (duplicate) throw new Error('标签已存在')
  await db.tags.update(id, { name: trimmed, updatedAt: new Date().toISOString() })
}

export async function archiveTag(id: string): Promise<void> {
  const tag = await db.tags.get(id)
  if (!tag) throw new Error('标签不存在')
  await db.tags.update(id, { archived: true, updatedAt: new Date().toISOString() })
}

export async function restoreTag(id: string): Promise<void> {
  const tag = await db.tags.get(id)
  if (!tag) throw new Error('标签不存在')
  const duplicate = await db.tags
    .filter((item) => item.id !== id && item.name === tag.name && !item.archived)
    .first()
  if (duplicate) throw new Error('存在同名启用标签')
  await db.tags.update(id, { archived: false, updatedAt: new Date().toISOString() })
}

export async function validateTagIds(tagIds: string[]): Promise<string[]> {
  const uniqueIds = [...new Set(tagIds)]
  if (uniqueIds.length === 0) return []
  const tags = await db.tags.bulkGet(uniqueIds)
  if (tags.some((tag) => !tag || tag.archived)) {
    throw new Error('包含不存在或已归档的标签')
  }
  return uniqueIds
}

export async function getOrCreateTagsByNames(names: string[]): Promise<Tag[]> {
  const requestedNames = normalizeTagNames(names, Number.MAX_SAFE_INTEGER)
  if (requestedNames.length === 0) return []

  const allTags = await db.tags.toArray()
  let nextOrder = allTags.reduce((max, tag) => Math.max(max, tag.order), 0) + 1
  const resolved: Tag[] = []

  for (const name of requestedNames) {
    const active = allTags.find((tag) => tag.name === name && !tag.archived)
    if (active) {
      resolved.push(active)
      continue
    }

    const archived = allTags.find((tag) => tag.name === name && tag.archived)
    if (archived) {
      const restored = { ...archived, archived: false, updatedAt: new Date().toISOString() }
      await db.tags.update(archived.id, { archived: false, updatedAt: restored.updatedAt })
      Object.assign(archived, restored)
      resolved.push(archived)
      continue
    }

    const now = new Date().toISOString()
    const tag: Tag = {
      id: generateId(),
      name,
      color: TAG_COLORS[(nextOrder - 1) % TAG_COLORS.length],
      order: nextOrder,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }
    nextOrder += 1
    await db.tags.add(tag)
    allTags.push(tag)
    resolved.push(tag)
  }

  return resolved
}
