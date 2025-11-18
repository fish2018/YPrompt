/**
 * API服务封装
 * 统一处理API请求，自动携带token
 */

// 生产环境使用相对路径，开发环境使用完整URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * 获取token
 */
function getToken(): string | null {
  return localStorage.getItem('yprompt_token')
}

/**
 * 通用请求方法
 */
async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  // 合并headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  // 如果有token，添加Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })
  
  const result = await response.json()
  
  // 如果token过期，清除本地token
  if (result.code === 401) {
    localStorage.removeItem('yprompt_token')
    localStorage.removeItem('yprompt_user')
    throw new Error('未授权，请重新登录')
  }
  
  return result
}

/**
 * GET请求
 */
export async function get<T = any>(url: string): Promise<T> {
  return request<T>(url, { method: 'GET' })
}

/**
 * POST请求
 */
export async function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT请求
 */
export async function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE请求
 */
export async function del<T = any>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' })
}

// ============ 提示词相关API ============

export interface SavePromptData {
  title: string
  description?: string
  requirement_report?: string
  thinking_points?: string[]
  initial_prompt?: string
  advice?: string[]
  final_prompt: string
  language?: string
  format?: string
  prompt_type?: string
  tags?: string[]
}

export interface Prompt {
  id: number
  user_id: number
  title: string
  description?: string
  requirement_report?: string
  thinking_points?: string
  initial_prompt?: string
  advice?: string
  final_prompt: string
  language: string
  format: string
  prompt_type: string
  is_favorite: number
  is_public: number
  view_count: number
  use_count: number
  tags?: string
  create_time: string
  update_time: string
  current_version?: string
  total_versions?: number
}

/**
 * 保存提示词
 */
export async function savePrompt(data: SavePromptData) {
  return post('/api/prompts', data)
}

/**
 * 获取提示词列表
 */
export async function getPrompts(params?: {
  page?: number
  limit?: number
  search?: string
  is_favorite?: boolean
  tags?: string[]
  language?: string
  format?: string
}) {
  const query = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query.append(key, value.join(','))
        } else {
          query.append(key, String(value))
        }
      }
    })
  }
  
  const queryString = query.toString()
  return get<{
    code: number
    data: {
      total: number
      page: number
      limit: number
      items: Prompt[]
    }
  }>(`/api/prompts${queryString ? '?' + queryString : ''}`)
}

/**
 * 获取提示词详情
 */
export async function getPrompt(id: number) {
  return get<{ code: number; data: Prompt }>(`/api/prompts/${id}`)
}

/**
 * 更新提示词
 */
export async function updatePrompt(id: number, data: Partial<SavePromptData>) {
  return put(`/api/prompts/${id}`, data)
}

/**
 * 删除提示词
 */
export async function deletePrompt(id: number) {
  return del(`/api/prompts/${id}`)
}

/**
 * 收藏/取消收藏提示词
 */
export async function toggleFavorite(id: number, is_favorite: boolean) {
  return post(`/api/prompts/${id}/favorite`, { is_favorite })
}

/**
 * 记录提示词使用次数
 */
export async function recordPromptUse(id: number) {
  return post(`/api/prompts/${id}/use`)
}

// ============ 标签相关API ============

/**
 * 获取用户标签列表
 */
export async function getTags() {
  return get('/api/tags')
}

/**
 * 获取热门标签
 */
export async function getPopularTags(limit = 10) {
  return get(`/api/tags/popular?limit=${limit}`)
}

/**
 * 创建标签
 */
export async function createTag(tag_name: string) {
  return post('/api/tags', { tag_name })
}

/**
 * 删除标签
 */
export async function deleteTag(id: number) {
  return del(`/api/tags/${id}`)
}

// ============ 提示词规则相关API ============

export interface PromptRules {
  id?: number
  user_id?: number
  system_prompt_rules?: string
  user_guided_prompt_rules?: string
  requirement_report_rules?: string
  thinking_points_extraction_prompt?: string
  thinking_points_system_message?: string
  system_prompt_generation_prompt?: string
  system_prompt_system_message?: string
  optimization_advice_prompt?: string
  optimization_advice_system_message?: string
  optimization_application_prompt?: string
  optimization_application_system_message?: string
  quality_analysis_system_prompt?: string
  user_prompt_quality_analysis?: string
  user_prompt_quick_optimization?: string
  user_prompt_rules?: string
  create_time?: string
  update_time?: string
}

/**
 * 获取用户的提示词规则
 */
export async function getUserPromptRules() {
  return get<{ code: number; data: PromptRules | null; message?: string }>('/api/prompt-rules')
}

/**
 * 保存用户的提示词规则
 */
export async function saveUserPromptRules(rules: PromptRules) {
  return post<{ code: number; data: PromptRules; message: string }>('/api/prompt-rules', rules)
}

/**
 * 删除用户的提示词规则（重置为默认）
 * @param fields 要删除的字段列表，如果不传则删除所有
 */
export async function deleteUserPromptRules(fields?: string[]) {
  if (fields && fields.length > 0) {
    // 删除指定字段：传空值
    const emptyData: Record<string, null> = {}
    fields.forEach(field => {
      emptyData[field] = null
    })
    return post<{ code: number; message: string }>('/api/prompt-rules', emptyData)
  } else {
    // 删除所有
    return del<{ code: number; message: string }>('/api/prompt-rules')
  }
}

