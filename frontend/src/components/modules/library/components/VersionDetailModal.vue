<template>
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-bold text-gray-900">版本详情</h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="关闭"
        >
          <span class="text-xl">✕</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="isLoading" class="flex items-center justify-center h-32">
          <div class="flex items-center gap-2 text-gray-500">
            <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>加载中...</span>
          </div>
        </div>

        <div v-else-if="versionDetail" class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">v{{ versionDetail.version_number }}</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">创建时间：</span>
                <span class="text-gray-900">{{ formatDateTime(versionDetail.create_time) }}</span>
              </div>
              <div>
                <span class="text-gray-600">创建者：</span>
                <span class="text-gray-900">{{ versionDetail.author_name }}</span>
              </div>
              <div>
                <span class="text-gray-600">版本类型：</span>
                <span class="text-gray-900">{{ getVersionTypeLabel(versionDetail.version_type) }}</span>
              </div>
              <div>
                <span class="text-gray-600">变更类型：</span>
                <span class="text-gray-900">{{ getChangeTypeLabel(versionDetail.change_type) }}</span>
              </div>
            </div>
          </div>

          <div class="border-t pt-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              变更说明
            </h4>
            <p class="text-sm text-gray-700">{{ versionDetail.change_summary || '无' }}</p>
            <div v-if="versionDetail.change_log" class="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
              {{ versionDetail.change_log }}
            </div>
          </div>

          <div class="border-t pt-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              统计信息
            </h4>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">内容大小：</span>
                <span class="text-gray-900">{{ formatSize(versionDetail.content_size) }}</span>
              </div>
              <div>
                <span class="text-gray-600">使用次数：</span>
                <span class="text-gray-900">{{ versionDetail.use_count }} 次</span>
              </div>
              <div>
                <span class="text-gray-600">回滚次数：</span>
                <span class="text-gray-900">{{ versionDetail.rollback_count }} 次</span>
              </div>
            </div>
          </div>

          <!-- 用户提示词上下文（仅用户提示词显示） -->
          <div v-if="versionDetail.system_prompt || versionDetail.conversation_history" class="border-t pt-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              用户提示词上下文
            </h4>
            
            <!-- 系统提示词 -->
            <div v-if="versionDetail.system_prompt" class="mb-4">
              <h5 class="text-xs font-semibold text-gray-700 mb-2">系统提示词</h5>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">{{ versionDetail.system_prompt }}</pre>
              </div>
            </div>
            
            <!-- 对话历史 -->
            <div v-if="versionDetail.conversation_history" class="mb-4">
              <h5 class="text-xs font-semibold text-gray-700 mb-2">对话历史</h5>
              <div class="bg-green-50 border border-green-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">{{ formatConversationHistory(versionDetail.conversation_history) }}</pre>
              </div>
            </div>
          </div>

          <div class="border-t pt-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ versionDetail.system_prompt || versionDetail.conversation_history ? '用户提示词内容' : '提示词内容' }}
            </h4>
            <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">{{ versionDetail.final_prompt || '无内容' }}</pre>
            </div>
          </div>

          <div v-if="versionDetail.tags && versionDetail.tags.length > 0" class="border-t pt-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              标签
            </h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in versionDetail.tags"
                :key="tag"
                class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3 p-6 border-t bg-gray-50">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          关闭
        </button>
        <button
          @click="handleRollback"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          回滚到此版本
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VersionService, type VersionInfo } from '@/services/versionService'
import { useNotificationStore } from '@/stores/notificationStore'

interface Props {
  version: VersionInfo | null
  promptId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  rollback: [version: VersionInfo]
}>()

const notificationStore = useNotificationStore()

const versionDetail = ref<VersionInfo | null>(null)
const isLoading = ref(false)

const loadVersionDetail = async () => {
  if (!props.version) return
  
  try {
    isLoading.value = true
    const result = await VersionService.getVersionDetail(props.promptId, props.version.id)
    
    if (result.code === 200) {
      versionDetail.value = result.data
    } else {
      throw new Error(result.message || '加载失败')
    }
  } catch (err: any) {
    console.error('加载版本详情失败:', err)
    notificationStore.error(`加载失败: ${err.message}`)
  } finally {
    isLoading.value = false
  }
}

const handleRollback = () => {
  if (versionDetail.value) {
    emit('rollback', versionDetail.value)
  }
}

const getVersionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    manual: '手动创建',
    auto: '自动保存',
    rollback: '回滚创建',
    import: '导入创建'
  }
  return labels[type] || type
}

const getChangeTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    major: '主要更新',
    minor: '次要更新',
    patch: '修订更新'
  }
  return labels[type] || type
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const formatConversationHistory = (history: string) => {
  try {
    // 尝试解析JSON格式的对话历史
    const parsed = JSON.parse(history)
    if (Array.isArray(parsed)) {
      return parsed.map((msg, index) => 
        `[${index + 1}] ${msg.role}: ${msg.content}`
      ).join('\n\n')
    }
    return history
  } catch {
    // 如果不是JSON，直接返回原始内容
    return history
  }
}

watch(() => props.version, (newVersion) => {
  if (newVersion) {
    loadVersionDetail()
  }
}, { immediate: true })
</script>
