interface AiClientOptions {
  apiKey: string
  model?: string
  provider?: string
}

interface AiClientResponse {
  success: boolean
  data: string | null
  error: string | null
}

export async function callLlmApi(
  prompt: string,
  options: AiClientOptions
): Promise<AiClientResponse> {
  const { apiKey, model = 'deepseek-chat', provider } = options

  if (!apiKey) {
    return { success: false, data: null, error: 'API Key 未配置' }
  }

  try {
    // OpenAI-compatible API (DeepSeek, OpenAI, etc.)
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
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
    }

    // Default: DeepSeek API (OpenAI-compatible)
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
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
