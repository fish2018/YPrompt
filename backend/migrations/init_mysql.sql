-- ==========================================
-- YPrompt MySQL 数据库初始化脚本
-- 支持双认证: Linux.do OAuth + 本地用户名密码
-- ==========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 用户表
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  
  -- Linux.do OAuth字段
  `linux_do_id` VARCHAR(64) DEFAULT NULL,
  `linux_do_username` VARCHAR(100) DEFAULT NULL,
  
  -- 本地认证字段
  `username` VARCHAR(50) DEFAULT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  
  -- 通用字段
  `name` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `auth_type` VARCHAR(10) NOT NULL DEFAULT 'linux_do' COMMENT '认证类型: linux_do/local',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否管理员',
  
  `last_login_time` DATETIME DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_linux_do_id` (`linux_do_id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_auth_type` (`auth_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- 提示词表
-- ----------------------------
DROP TABLE IF EXISTS `prompts`;
CREATE TABLE `prompts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  
  -- GPrompt 四步生成内容
  `requirement_report` TEXT DEFAULT NULL,
  `thinking_points` TEXT DEFAULT NULL,
  `initial_prompt` TEXT DEFAULT NULL,
  `advice` TEXT DEFAULT NULL,
  `final_prompt` TEXT DEFAULT NULL,
  
  -- 提示词配置
  `language` VARCHAR(10) DEFAULT 'zh' COMMENT '语言: zh/en',
  `format` VARCHAR(10) DEFAULT 'markdown' COMMENT '格式: markdown/xml',
  `prompt_type` VARCHAR(10) DEFAULT 'system' COMMENT '类型: system/user',
  
  -- 用户提示词专用字段（当prompt_type='user'时使用）
  `system_prompt` TEXT DEFAULT NULL COMMENT '系统提示词（用户提示词上下文）',
  `conversation_history` TEXT DEFAULT NULL COMMENT '对话历史（用户提示词上下文）',
  
  -- 状态标记
  `is_favorite` TINYINT(1) DEFAULT 0,
  `is_public` TINYINT(1) DEFAULT 0,
  
  -- 统计信息
  `view_count` INT(11) DEFAULT 0,
  `use_count` INT(11) DEFAULT 0,
  
  -- 标签 (逗号分隔)
  `tags` VARCHAR(500) DEFAULT NULL,
  
  -- 版本信息
  `current_version` VARCHAR(20) DEFAULT '1.0.0',
  `total_versions` INT(11) DEFAULT 1,
  `last_version_time` DATETIME DEFAULT NULL,
  
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_prompts_user_id` (`user_id`),
  KEY `idx_prompts_is_favorite` (`is_favorite`),
  KEY `idx_prompts_is_public` (`is_public`),
  KEY `idx_prompts_create_time` (`create_time`),
  CONSTRAINT `fk_prompts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提示词表';

-- ----------------------------
-- 提示词版本表
-- ----------------------------
DROP TABLE IF EXISTS `prompt_versions`;
CREATE TABLE `prompt_versions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `prompt_id` INT(11) NOT NULL,
  
  -- 版本标识
  `version_number` VARCHAR(20) NOT NULL COMMENT '版本号（如 1.2.3）',
  `version_type` VARCHAR(10) DEFAULT 'manual' COMMENT '版本类型: manual/auto/rollback',
  `version_tag` VARCHAR(50) DEFAULT NULL COMMENT '版本标签: draft/stable/production',
  
  -- 完整内容快照
  `title` VARCHAR(200) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `requirement_report` TEXT DEFAULT NULL,
  `thinking_points` TEXT DEFAULT NULL,
  `initial_prompt` TEXT DEFAULT NULL,
  `advice` TEXT DEFAULT NULL,
  `final_prompt` TEXT NOT NULL,
  
  `language` VARCHAR(10) DEFAULT 'zh',
  `format` VARCHAR(10) DEFAULT 'markdown',
  `tags` VARCHAR(500) DEFAULT NULL,
  
  -- 用户提示词上下文（保存完整上下文）
  `system_prompt` TEXT DEFAULT NULL COMMENT '系统提示词（用户提示词上下文）',
  `conversation_history` TEXT DEFAULT NULL COMMENT '对话历史（用户提示词上下文）',
  
  -- 版本元数据
  `change_log` TEXT DEFAULT NULL,
  `change_summary` VARCHAR(500) DEFAULT NULL,
  `change_type` VARCHAR(10) DEFAULT 'patch' COMMENT '变更类型: major/minor/patch',
  `created_by` INT(11) DEFAULT NULL,
  `parent_version_id` INT(11) DEFAULT NULL,
  
  -- 统计
  `use_count` INT(11) DEFAULT 0,
  `rollback_count` INT(11) DEFAULT 0,
  `content_size` INT(11) DEFAULT 0,
  
  -- 标记
  `is_auto_save` TINYINT(1) DEFAULT 0,
  `is_deleted` TINYINT(1) DEFAULT 0,
  
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_prompt_version` (`prompt_id`, `version_number`),
  KEY `idx_versions_prompt_id` (`prompt_id`),
  KEY `idx_versions_created_by` (`created_by`),
  KEY `idx_versions_create_time` (`create_time`),
  CONSTRAINT `fk_versions_prompt_id` FOREIGN KEY (`prompt_id`) REFERENCES `prompts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_versions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提示词版本表';

-- ----------------------------
-- 标签表
-- ----------------------------
DROP TABLE IF EXISTS `prompt_tags`;
CREATE TABLE `prompt_tags` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tag_name` VARCHAR(50) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `use_count` INT(11) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_tag` (`user_id`, `tag_name`),
  KEY `idx_tags_user_id` (`user_id`),
  CONSTRAINT `fk_tags_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ----------------------------
-- 分享表
-- ----------------------------
DROP TABLE IF EXISTS `prompt_shares`;
CREATE TABLE `prompt_shares` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `prompt_id` INT(11) NOT NULL,
  `share_code` VARCHAR(32) NOT NULL,
  `expire_time` DATETIME DEFAULT NULL,
  `view_count` INT(11) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_share_code` (`share_code`),
  KEY `idx_shares_prompt_id` (`prompt_id`),
  CONSTRAINT `fk_shares_prompt_id` FOREIGN KEY (`prompt_id`) REFERENCES `prompts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享表';

-- ----------------------------
-- 用户会话表
-- ----------------------------
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expire_time` DATETIME NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_token_hash` (`token_hash`),
  KEY `idx_sessions_expire_time` (`expire_time`),
  CONSTRAINT `fk_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

SET FOREIGN_KEY_CHECKS = 1;
