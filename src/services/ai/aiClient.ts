interface AiClientOptions {
  apiKey: string
  model?: string
}

interface AiClientResponse {
  success: boolean
  data: string | null
  error: string | null
}

/**
 * 调用 DeepSeek API（OpenAI 兼容接口）
 * 支持 deepseek-v4-flash 和 deepseek-v4-pro
 */
export async function callLlmApi(
  prompt: string,
  options: AiClientOptions
): Promise<AiClientResponse> {
  const { apiKey, model = 'deepseek-v4-flash' } = options

  if (!apiKey) {
    return { success: false, data: null, error: 'API Key 未配置' }
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return { success: false, data: null, error: `API 请求失败 (${response.status}): ${err}` }
    }

    const json = await response.json()
    const text = json.choices?.[0]?.message?.content ?? ''
    return { success: true, data: text, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : '网络请求失败'
    return { success: false, data: null, error: message }
  }
}
