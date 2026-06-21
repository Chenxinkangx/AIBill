import type { ParsedRecordItem, BudgetCategory, Tag } from '../../types'
import { buildPrompt } from './prompt'
import { callLlmApi } from './aiClient'
import { normalizeParsedItems } from './normalize'
import { useSettingsStore } from '../../stores/settingsStore'

export interface ParseResult {
  items: ParsedRecordItem[]
  error: string | null
}

/**
 * AI 解析自然语言记账输入
 * 完整流程：构建 Prompt → 调用 LLM API → 校验规范化 → 返回结果
 */
export async function parseNaturalLanguageRecord(
  input: string,
  categories: BudgetCategory[],
  today: string,
  tags: Tag[] = []
): Promise<ParseResult> {
  if (!input.trim()) {
    return { items: [], error: null }
  }

  const settings = useSettingsStore.getState()
  const apiKey = settings.aiApiKey

  if (!apiKey) {
    return {
      items: [],
      error: '请先在设置页配置 AI API Key',
    }
  }

  const prompt = buildPrompt(input, categories, today, tags)
  const response = await callLlmApi(prompt, {
    apiKey,
    model: settings.settings?.aiModel ?? 'deepseek-v4-flash',
  })

  if (!response.success || !response.data) {
    return { items: [], error: response.error ?? '暂时无法识别，请尝试简化描述或使用手动记账' }
  }

  // Try to extract JSON from response
  let jsonData: unknown[]
  try {
    // Handle cases where AI wraps JSON in markdown code blocks
    const cleaned = response.data
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    jsonData = JSON.parse(cleaned)
  } catch {
    return {
      items: [],
      error: 'AI 解析失败，请重试或使用手动记账',
    }
  }

  const originalInput = input.trim()
  const items = normalizeParsedItems(jsonData, categories, tags).map((item) => ({
    ...item,
    rawText: originalInput,
  }))

  if (items.length === 0) {
    return {
      items: [],
      error: '未识别到有效账单，请补充金额信息',
    }
  }

  return { items, error: null }
}
