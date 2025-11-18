// 内置系统提示词配置
// 保持独立性，便于修改和维护
// 提示词规则已拆分到 prompts/ 目录下的独立文件中

import { 
  SYSTEM_PROMPT_RULES,
  SYSTEM_PROMPT_SLIM_RULES, 
  USER_GUIDED_PROMPT_RULES,
  REQUIREMENT_REPORT_RULES,
  FINAL_PROMPT_GENERATION_RULES,
  FINAL_PROMPT_SYSTEM_MESSAGES
} from './prompts/index'

// 导入独立的提示词
import { 
  THINKING_POINTS_EXTRACTION_PROMPT, 
  THINKING_POINTS_SYSTEM_MESSAGE 
} from './prompts/thinkingPointsExtraction'
import { 
  SYSTEM_PROMPT_GENERATION_PROMPT, 
  SYSTEM_PROMPT_SYSTEM_MESSAGE 
} from './prompts/systemPromptGeneration'
import { 
  OPTIMIZATION_ADVICE_PROMPT, 
  OPTIMIZATION_ADVICE_SYSTEM_MESSAGE 
} from './prompts/optimizationAdvice'
import { 
  OPTIMIZATION_APPLICATION_PROMPT, 
  OPTIMIZATION_APPLICATION_SYSTEM_MESSAGE 
} from './prompts/optimizationApplication'
import { 
  QUALITY_ANALYSIS_SYSTEM_PROMPT
} from './prompts/qualityAnalysis'
import {
  USER_PROMPT_OPTIMIZATION_CONFIG,
  USER_PROMPT_RULES
} from './prompts/userPromptOptimization'
import { USER_PROMPT_QUALITY_ANALYSIS } from './prompts/userPromptQualityAnalysis'

export interface PromptConfig {
  systemPromptRules: string
  userGuidedPromptRules: string
  requirementReportRules: string
  // 独立的最终提示词生成配置
  thinkingPointsExtractionPrompt: string
  thinkingPointsSystemMessage: string
  systemPromptGenerationPrompt: string
  systemPromptSystemMessage: string
  optimizationAdvicePrompt: string
  optimizationAdviceSystemMessage: string
  optimizationApplicationPrompt: string
  optimizationApplicationSystemMessage: string
  // 系统提示词质量分析配置
  qualityAnalysisSystemPrompt: string
  // 用户提示词优化配置
  userPromptQualityAnalysis: string
  userPromptQuickOptimization: string
  userPromptRules: string
}

// 提示词配置管理类
export class PromptConfigManager {
  private static instance: PromptConfigManager
  private config: PromptConfig
  private useSlimRules: boolean = false
  private dirtyFields: Set<string> = new Set() // 追踪修改的字段
  
  private constructor() {
    this.config = {
      systemPromptRules: SYSTEM_PROMPT_RULES,
      userGuidedPromptRules: USER_GUIDED_PROMPT_RULES,
      requirementReportRules: REQUIREMENT_REPORT_RULES,
      // 独立的最终提示词生成配置
      thinkingPointsExtractionPrompt: THINKING_POINTS_EXTRACTION_PROMPT,
      thinkingPointsSystemMessage: THINKING_POINTS_SYSTEM_MESSAGE,
      systemPromptGenerationPrompt: SYSTEM_PROMPT_GENERATION_PROMPT,
      systemPromptSystemMessage: SYSTEM_PROMPT_SYSTEM_MESSAGE,
      optimizationAdvicePrompt: OPTIMIZATION_ADVICE_PROMPT,
      optimizationAdviceSystemMessage: OPTIMIZATION_ADVICE_SYSTEM_MESSAGE,
      optimizationApplicationPrompt: OPTIMIZATION_APPLICATION_PROMPT,
      optimizationApplicationSystemMessage: OPTIMIZATION_APPLICATION_SYSTEM_MESSAGE,
      // 系统提示词质量分析配置
      qualityAnalysisSystemPrompt: QUALITY_ANALYSIS_SYSTEM_PROMPT,
      // 用户提示词优化配置
      userPromptQualityAnalysis: USER_PROMPT_QUALITY_ANALYSIS,
      userPromptQuickOptimization: USER_PROMPT_OPTIMIZATION_CONFIG.quick,
      userPromptRules: USER_PROMPT_RULES
    }
    this.loadFromStorage()
  }

  public static getInstance(): PromptConfigManager {
    if (!PromptConfigManager.instance) {
      PromptConfigManager.instance = new PromptConfigManager()
    }
    return PromptConfigManager.instance
  }

  public setUseSlimRules(useSlim: boolean): void {
    this.useSlimRules = useSlim
  }

  public getSystemPromptRules(): string {
    // 根据设置返回完整版或精简版
    if (this.useSlimRules) {
      return SYSTEM_PROMPT_SLIM_RULES
    }
    return this.config.systemPromptRules
  }

  public getUserGuidedPromptRules(): string {
    return this.config.userGuidedPromptRules
  }

  public updateSystemPromptRules(rules: string): void {
    this.config.systemPromptRules = rules
    this.dirtyFields.add('system_prompt_rules')
    this.saveToStorage()
  }

  public updateUserGuidedPromptRules(rules: string): void {
    this.config.userGuidedPromptRules = rules
    this.dirtyFields.add('user_guided_prompt_rules')
    this.saveToStorage()
  }

  public getRequirementReportRules(): string {
    return this.config.requirementReportRules
  }

  public updateRequirementReportRules(rules: string): void {
    this.config.requirementReportRules = rules
    this.dirtyFields.add('requirement_report_rules')
    this.saveToStorage()
  }

  // 独立的最终提示词生成配置获取方法
  public getThinkingPointsExtractionPrompt(): string {
    return this.config.thinkingPointsExtractionPrompt
  }

  public getThinkingPointsSystemMessage(): string {
    return this.config.thinkingPointsSystemMessage
  }

  public getSystemPromptGenerationPrompt(): string {
    return this.config.systemPromptGenerationPrompt
  }

  public getSystemPromptSystemMessage(): string {
    return this.config.systemPromptSystemMessage
  }

  public getOptimizationAdvicePrompt(): string {
    return this.config.optimizationAdvicePrompt
  }

  public getOptimizationAdviceSystemMessage(): string {
    return this.config.optimizationAdviceSystemMessage
  }

  public getOptimizationApplicationPrompt(): string {
    return this.config.optimizationApplicationPrompt
  }

  public getOptimizationApplicationSystemMessage(): string {
    return this.config.optimizationApplicationSystemMessage
  }

  // 质量分析配置获取方法
  public getQualityAnalysisSystemPrompt(): string {
    return this.config.qualityAnalysisSystemPrompt
  }

  // 用户提示词优化配置获取方法
  public getUserPromptQualityAnalysis(): string {
    return this.config.userPromptQualityAnalysis
  }

  public getUserPromptQuickOptimization(): string {
    return this.config.userPromptQuickOptimization
  }

  public getUserPromptRules(): string {
    return this.config.userPromptRules
  }

  // 独立的最终提示词生成配置更新方法
  public updateThinkingPointsExtractionPrompt(prompt: string): void {
    this.config.thinkingPointsExtractionPrompt = prompt
    this.dirtyFields.add('thinking_points_extraction_prompt')
    this.saveToStorage()
  }

  public updateThinkingPointsSystemMessage(message: string): void {
    this.config.thinkingPointsSystemMessage = message
    this.saveToStorage()
  }

  public updateSystemPromptGenerationPrompt(prompt: string): void {
    this.config.systemPromptGenerationPrompt = prompt
    this.dirtyFields.add('system_prompt_generation_prompt')
    this.saveToStorage()
  }

  public updateSystemPromptSystemMessage(message: string): void {
    this.config.systemPromptSystemMessage = message
    this.saveToStorage()
  }

  public updateOptimizationAdvicePrompt(prompt: string): void {
    this.config.optimizationAdvicePrompt = prompt
    this.dirtyFields.add('optimization_advice_prompt')
    this.saveToStorage()
  }

  public updateOptimizationAdviceSystemMessage(message: string): void {
    this.config.optimizationAdviceSystemMessage = message
    this.saveToStorage()
  }

  public updateOptimizationApplicationPrompt(prompt: string): void {
    this.config.optimizationApplicationPrompt = prompt
    this.dirtyFields.add('optimization_application_prompt')
    this.saveToStorage()
  }

  public updateOptimizationApplicationSystemMessage(message: string): void {
    this.config.optimizationApplicationSystemMessage = message
    this.saveToStorage()
  }

  // 质量分析配置更新方法
  public updateQualityAnalysisSystemPrompt(prompt: string): void {
    this.config.qualityAnalysisSystemPrompt = prompt
    this.dirtyFields.add('quality_analysis_system_prompt')
    this.saveToStorage()
  }

  // 用户提示词优化配置更新方法
  public updateUserPromptQualityAnalysis(prompt: string): void {
    this.config.userPromptQualityAnalysis = prompt
    this.dirtyFields.add('user_prompt_quality_analysis')
    this.saveToStorage()
  }

  public updateUserPromptQuickOptimization(prompt: string): void {
    this.config.userPromptQuickOptimization = prompt
    this.dirtyFields.add('user_prompt_quick_optimization')
    this.saveToStorage()
  }

  public updateUserPromptRules(rules: string): void {
    this.config.userPromptRules = rules
    this.saveToStorage()
  }

  // 向后兼容方法：获取合并后的最终提示词生成规则
  public getFinalPromptGenerationRules(): typeof FINAL_PROMPT_GENERATION_RULES {
    return {
      THINKING_POINTS_EXTRACTION: this.config.thinkingPointsExtractionPrompt,
      SYSTEM_PROMPT_GENERATION: this.config.systemPromptGenerationPrompt,
      OPTIMIZATION_ADVICE_GENERATION: this.config.optimizationAdvicePrompt,
      OPTIMIZATION_APPLICATION: this.config.optimizationApplicationPrompt
    }
  }

  // 向后兼容方法：获取合并后的最终提示词系统消息
  public getFinalPromptSystemMessages(): typeof FINAL_PROMPT_SYSTEM_MESSAGES {
    return {
      THINKING_POINTS_SYSTEM: this.config.thinkingPointsSystemMessage,
      SYSTEM_PROMPT_SYSTEM: this.config.systemPromptSystemMessage,
      OPTIMIZATION_ADVICE_SYSTEM: this.config.optimizationAdviceSystemMessage,
      OPTIMIZATION_APPLICATION_SYSTEM: this.config.optimizationApplicationSystemMessage
    }
  }

  public resetToDefaults(): void {
    this.config.systemPromptRules = SYSTEM_PROMPT_RULES
    this.config.userGuidedPromptRules = USER_GUIDED_PROMPT_RULES
    this.config.requirementReportRules = REQUIREMENT_REPORT_RULES
    // 重置独立的最终提示词生成配置
    this.config.thinkingPointsExtractionPrompt = THINKING_POINTS_EXTRACTION_PROMPT
    this.config.thinkingPointsSystemMessage = THINKING_POINTS_SYSTEM_MESSAGE
    this.config.systemPromptGenerationPrompt = SYSTEM_PROMPT_GENERATION_PROMPT
    this.config.systemPromptSystemMessage = SYSTEM_PROMPT_SYSTEM_MESSAGE
    this.config.optimizationAdvicePrompt = OPTIMIZATION_ADVICE_PROMPT
    this.config.optimizationAdviceSystemMessage = OPTIMIZATION_ADVICE_SYSTEM_MESSAGE
    this.config.optimizationApplicationPrompt = OPTIMIZATION_APPLICATION_PROMPT
    this.config.optimizationApplicationSystemMessage = OPTIMIZATION_APPLICATION_SYSTEM_MESSAGE
    // 重置质量分析配置
    this.config.qualityAnalysisSystemPrompt = QUALITY_ANALYSIS_SYSTEM_PROMPT
    // 重置用户提示词优化配置
    this.config.userPromptQuickOptimization = USER_PROMPT_OPTIMIZATION_CONFIG.quick
    this.config.userPromptRules = USER_PROMPT_RULES
    this.saveToStorage()
  }

  // 重置系统提示词规则为默认值
  public async resetSystemPromptRules(): Promise<void> {
    this.config.systemPromptRules = SYSTEM_PROMPT_RULES
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['system_prompt_rules'])
  }

  // 重置用户引导规则为默认值
  public async resetUserGuidedPromptRules(): Promise<void> {
    this.config.userGuidedPromptRules = USER_GUIDED_PROMPT_RULES
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['user_guided_prompt_rules'])
  }

  // 重置需求报告规则为默认值
  public async resetRequirementReportRules(): Promise<void> {
    this.config.requirementReportRules = REQUIREMENT_REPORT_RULES
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['requirement_report_rules'])
  }

  // 重置独立的最终提示词生成配置为默认值
  public async resetThinkingPointsExtractionPrompt(): Promise<void> {
    this.config.thinkingPointsExtractionPrompt = THINKING_POINTS_EXTRACTION_PROMPT
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['thinking_points_extraction_prompt'])
  }

  public resetThinkingPointsSystemMessage(): void {
    this.config.thinkingPointsSystemMessage = THINKING_POINTS_SYSTEM_MESSAGE
    this.saveToStorage()
  }

  public async resetSystemPromptGenerationPrompt(): Promise<void> {
    this.config.systemPromptGenerationPrompt = SYSTEM_PROMPT_GENERATION_PROMPT
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['system_prompt_generation_prompt'])
  }

  public resetSystemPromptSystemMessage(): void {
    this.config.systemPromptSystemMessage = SYSTEM_PROMPT_SYSTEM_MESSAGE
    this.saveToStorage()
  }

  public async resetOptimizationAdvicePrompt(): Promise<void> {
    this.config.optimizationAdvicePrompt = OPTIMIZATION_ADVICE_PROMPT
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['optimization_advice_prompt'])
  }

  public resetOptimizationAdviceSystemMessage(): void {
    this.config.optimizationAdviceSystemMessage = OPTIMIZATION_ADVICE_SYSTEM_MESSAGE
    this.saveToStorage()
  }

  public async resetOptimizationApplicationPrompt(): Promise<void> {
    this.config.optimizationApplicationPrompt = OPTIMIZATION_APPLICATION_PROMPT
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['optimization_application_prompt'])
  }

  public resetOptimizationApplicationSystemMessage(): void {
    this.config.optimizationApplicationSystemMessage = OPTIMIZATION_APPLICATION_SYSTEM_MESSAGE
    this.saveToStorage()
  }

  // 重置质量分析配置为默认值
  public async resetQualityAnalysisSystemPrompt(): Promise<void> {
    this.config.qualityAnalysisSystemPrompt = QUALITY_ANALYSIS_SYSTEM_PROMPT
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['quality_analysis_system_prompt'])
  }

  // 重置用户提示词优化配置为默认值
  public async resetUserPromptQualityAnalysis(): Promise<void> {
    this.config.userPromptQualityAnalysis = USER_PROMPT_QUALITY_ANALYSIS
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['user_prompt_quality_analysis'])
  }

  public async resetUserPromptQuickOptimization(): Promise<void> {
    this.config.userPromptQuickOptimization = USER_PROMPT_OPTIMIZATION_CONFIG.quick
    this.saveToStorage()
    const { deleteUserPromptRules } = await import('@/services/apiService')
    await deleteUserPromptRules(['user_prompt_quick_optimization'])
  }

  public resetUserPromptRules(): void {
    this.config.userPromptRules = USER_PROMPT_RULES
    this.saveToStorage()
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('yprompt_config', JSON.stringify(this.config))
    } catch (error) {
    }
  }

  /**
   * 保存到云端（只保存修改过的字段）
   */
  public async saveToCloud(): Promise<void> {
    try {
      if (this.dirtyFields.size === 0) {
        console.log('[PromptConfig] 无修改，跳过保存')
        return
      }

      const { saveUserPromptRules } = await import('@/services/apiService')
      
      // 映射关系：驼峰 -> 下划线
      const fieldMapping: Record<string, keyof PromptConfig> = {
        'system_prompt_rules': 'systemPromptRules',
        'user_guided_prompt_rules': 'userGuidedPromptRules',
        'requirement_report_rules': 'requirementReportRules',
        'thinking_points_extraction_prompt': 'thinkingPointsExtractionPrompt',
        'thinking_points_system_message': 'thinkingPointsSystemMessage',
        'system_prompt_generation_prompt': 'systemPromptGenerationPrompt',
        'system_prompt_system_message': 'systemPromptSystemMessage',
        'optimization_advice_prompt': 'optimizationAdvicePrompt',
        'optimization_advice_system_message': 'optimizationAdviceSystemMessage',
        'optimization_application_prompt': 'optimizationApplicationPrompt',
        'optimization_application_system_message': 'optimizationApplicationSystemMessage',
        'quality_analysis_system_prompt': 'qualityAnalysisSystemPrompt',
        'user_prompt_quality_analysis': 'userPromptQualityAnalysis',
        'user_prompt_quick_optimization': 'userPromptQuickOptimization',
        'user_prompt_rules': 'userPromptRules'
      }
      
      // 只保存修改过的字段
      const cloudData: Record<string, any> = {}
      this.dirtyFields.forEach(fieldName => {
        const configKey = fieldMapping[fieldName]
        if (configKey) {
          cloudData[fieldName] = this.config[configKey]
        }
      })
      
      console.log('[PromptConfig] 保存修改的字段:', Array.from(this.dirtyFields))
      await saveUserPromptRules(cloudData)
      
      // 保存成功后，清空脏字段标记
      this.dirtyFields.clear()
      this.saveToStorage()
    } catch (error) {
      console.error('保存到云端失败:', error)
      throw error
    }
  }

  /**
   * 从云端加载配置（浏览器会话期间只调用一次）
   */
  public async loadFromCloud(): Promise<boolean> {
    try {
      // 检查本次会话是否已加载过（使用sessionStorage，关闭浏览器后失效）
      const sessionLoaded = sessionStorage.getItem('yprompt_config_session_loaded')
      if (sessionLoaded === 'true') {
        console.log('[PromptConfig] 本次会话已加载，跳过API调用')
        return true
      }
      
      console.log('[PromptConfig] 首次会话加载，从云端获取最新配置')
      const { getUserPromptRules } = await import('@/services/apiService')
      const response = await getUserPromptRules()
      
      if (response.code === 200 && response.data) {
        const cloudConfig = response.data
        // 只有云端有数据的字段才覆盖默认值
        this.config = {
          systemPromptRules: cloudConfig.system_prompt_rules || SYSTEM_PROMPT_RULES,
          userGuidedPromptRules: cloudConfig.user_guided_prompt_rules || USER_GUIDED_PROMPT_RULES,
          requirementReportRules: cloudConfig.requirement_report_rules || REQUIREMENT_REPORT_RULES,
          thinkingPointsExtractionPrompt: cloudConfig.thinking_points_extraction_prompt || THINKING_POINTS_EXTRACTION_PROMPT,
          thinkingPointsSystemMessage: cloudConfig.thinking_points_system_message || THINKING_POINTS_SYSTEM_MESSAGE,
          systemPromptGenerationPrompt: cloudConfig.system_prompt_generation_prompt || SYSTEM_PROMPT_GENERATION_PROMPT,
          systemPromptSystemMessage: cloudConfig.system_prompt_system_message || SYSTEM_PROMPT_SYSTEM_MESSAGE,
          optimizationAdvicePrompt: cloudConfig.optimization_advice_prompt || OPTIMIZATION_ADVICE_PROMPT,
          optimizationAdviceSystemMessage: cloudConfig.optimization_advice_system_message || OPTIMIZATION_ADVICE_SYSTEM_MESSAGE,
          optimizationApplicationPrompt: cloudConfig.optimization_application_prompt || OPTIMIZATION_APPLICATION_PROMPT,
          optimizationApplicationSystemMessage: cloudConfig.optimization_application_system_message || OPTIMIZATION_APPLICATION_SYSTEM_MESSAGE,
          qualityAnalysisSystemPrompt: cloudConfig.quality_analysis_system_prompt || QUALITY_ANALYSIS_SYSTEM_PROMPT,
          userPromptQualityAnalysis: cloudConfig.user_prompt_quality_analysis || USER_PROMPT_QUALITY_ANALYSIS,
          userPromptQuickOptimization: cloudConfig.user_prompt_quick_optimization || USER_PROMPT_OPTIMIZATION_CONFIG.quick,
          userPromptRules: cloudConfig.user_prompt_rules || USER_PROMPT_RULES
        }
        this.saveToStorage()
        // 标记本次会话已加载（关闭浏览器后失效）
        sessionStorage.setItem('yprompt_config_session_loaded', 'true')
        console.log('[PromptConfig] 云端配置加载成功，已标记会话')
        return true
      } else {
        console.log('[PromptConfig] 云端无数据，使用默认配置')
        // 即使没有数据，也标记为已加载
        sessionStorage.setItem('yprompt_config_session_loaded', 'true')
        return false
      }
    } catch (error) {
      console.error('[PromptConfig] 从云端加载失败:', error)
      // 失败也标记，避免反复请求
      sessionStorage.setItem('yprompt_config_session_loaded', 'true')
      return false
    }
  }
  
  /**
   * 手动刷新云端配置（用于用户点击刷新按钮）
   */
  public async forceReloadFromCloud(): Promise<boolean> {
    sessionStorage.removeItem('yprompt_config_session_loaded')
    return this.loadFromCloud()
  }

  public async deleteFromCloud(): Promise<void> {
    try {
      const { deleteUserPromptRules } = await import('@/services/apiService')
      await deleteUserPromptRules()
    } catch (error) {
      console.error('删除云端配置失败:', error)
      throw error
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('yprompt_config')
      if (saved) {
        const parsed = JSON.parse(saved)
        // 只加载用户自定义的内容，如果不存在则使用默认值
        this.config.systemPromptRules = parsed.systemPromptRules || SYSTEM_PROMPT_RULES
        this.config.userGuidedPromptRules = parsed.userGuidedPromptRules || USER_GUIDED_PROMPT_RULES
        this.config.requirementReportRules = parsed.requirementReportRules || REQUIREMENT_REPORT_RULES
        // 加载独立的最终提示词生成配置，向后兼容旧版本
        this.config.thinkingPointsExtractionPrompt = parsed.thinkingPointsExtractionPrompt || THINKING_POINTS_EXTRACTION_PROMPT
        this.config.thinkingPointsSystemMessage = parsed.thinkingPointsSystemMessage || THINKING_POINTS_SYSTEM_MESSAGE
        this.config.systemPromptGenerationPrompt = parsed.systemPromptGenerationPrompt || SYSTEM_PROMPT_GENERATION_PROMPT
        this.config.systemPromptSystemMessage = parsed.systemPromptSystemMessage || SYSTEM_PROMPT_SYSTEM_MESSAGE
        this.config.optimizationAdvicePrompt = parsed.optimizationAdvicePrompt || OPTIMIZATION_ADVICE_PROMPT
        this.config.optimizationAdviceSystemMessage = parsed.optimizationAdviceSystemMessage || OPTIMIZATION_ADVICE_SYSTEM_MESSAGE
        this.config.optimizationApplicationPrompt = parsed.optimizationApplicationPrompt || OPTIMIZATION_APPLICATION_PROMPT
        this.config.optimizationApplicationSystemMessage = parsed.optimizationApplicationSystemMessage || OPTIMIZATION_APPLICATION_SYSTEM_MESSAGE
        // 加载质量分析配置
        this.config.qualityAnalysisSystemPrompt = parsed.qualityAnalysisSystemPrompt || QUALITY_ANALYSIS_SYSTEM_PROMPT
        // 加载用户提示词优化配置
        this.config.userPromptQualityAnalysis = parsed.userPromptQualityAnalysis || USER_PROMPT_QUALITY_ANALYSIS
        this.config.userPromptQuickOptimization = parsed.userPromptQuickOptimization || USER_PROMPT_OPTIMIZATION_CONFIG.quick
        this.config.userPromptRules = parsed.userPromptRules || USER_PROMPT_RULES
      }
    } catch (error) {
      // 加载失败时使用默认配置
      this.config = {
        systemPromptRules: SYSTEM_PROMPT_RULES,
        userGuidedPromptRules: USER_GUIDED_PROMPT_RULES,
        requirementReportRules: REQUIREMENT_REPORT_RULES,
        // 独立的最终提示词生成配置
        thinkingPointsExtractionPrompt: THINKING_POINTS_EXTRACTION_PROMPT,
        thinkingPointsSystemMessage: THINKING_POINTS_SYSTEM_MESSAGE,
        systemPromptGenerationPrompt: SYSTEM_PROMPT_GENERATION_PROMPT,
        systemPromptSystemMessage: SYSTEM_PROMPT_SYSTEM_MESSAGE,
        optimizationAdvicePrompt: OPTIMIZATION_ADVICE_PROMPT,
        optimizationAdviceSystemMessage: OPTIMIZATION_ADVICE_SYSTEM_MESSAGE,
        optimizationApplicationPrompt: OPTIMIZATION_APPLICATION_PROMPT,
        optimizationApplicationSystemMessage: OPTIMIZATION_APPLICATION_SYSTEM_MESSAGE,
        // 系统提示词质量分析配置
        qualityAnalysisSystemPrompt: QUALITY_ANALYSIS_SYSTEM_PROMPT,
        // 用户提示词优化配置
        userPromptQualityAnalysis: USER_PROMPT_QUALITY_ANALYSIS,
        userPromptQuickOptimization: USER_PROMPT_OPTIMIZATION_CONFIG.quick,
        userPromptRules: USER_PROMPT_RULES
      }
    }
  }
}

// 单例实例导出
export const promptConfigManager = PromptConfigManager.getInstance()