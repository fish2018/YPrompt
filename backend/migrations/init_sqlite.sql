-- ==========================================
-- YPrompt SQLite 数据库初始化脚本
-- 支持双认证: Linux.do OAuth + 本地用户名密码
-- ==========================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Linux.do OAuth字段
  linux_do_id VARCHAR(64) DEFAULT NULL,
  linux_do_username VARCHAR(100) DEFAULT NULL,
  
  -- 本地认证字段
  username VARCHAR(50) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  
  -- 通用字段
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  auth_type VARCHAR(10) NOT NULL DEFAULT 'linux_do',
  is_active INTEGER NOT NULL DEFAULT 1,
  is_admin INTEGER NOT NULL DEFAULT 0,
  
  last_login_time DATETIME DEFAULT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_linux_do_id ON users(linux_do_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_auth_type ON users(auth_type);
CREATE INDEX IF NOT EXISTS idx_is_active ON users(is_active);

-- 提示词表
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  
  -- GPrompt 四步生成内容
  requirement_report TEXT DEFAULT NULL,
  thinking_points TEXT DEFAULT NULL,
  initial_prompt TEXT DEFAULT NULL,
  advice TEXT DEFAULT NULL,
  final_prompt TEXT DEFAULT NULL,
  
  -- 提示词配置
  language VARCHAR(10) DEFAULT 'zh',
  format VARCHAR(10) DEFAULT 'markdown',
  prompt_type VARCHAR(10) DEFAULT 'system',
  
  -- 用户提示词专用字段（当prompt_type='user'时使用）
  system_prompt TEXT DEFAULT NULL,
  conversation_history TEXT DEFAULT NULL,
  
  -- 状态标记
  is_favorite INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 0,
  
  -- 统计信息
  view_count INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  
  -- 标签 (逗号分隔)
  tags VARCHAR(500) DEFAULT NULL,
  
  -- 版本信息
  current_version VARCHAR(20) DEFAULT '1.0.0',
  total_versions INTEGER DEFAULT 1,
  last_version_time DATETIME DEFAULT NULL,
  
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_create_time ON prompts(create_time);

-- 提示词版本表
CREATE TABLE IF NOT EXISTS prompt_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id INTEGER NOT NULL,
  
  -- 版本标识
  version_number VARCHAR(20) NOT NULL,
  version_type VARCHAR(10) DEFAULT 'manual',
  version_tag VARCHAR(50) DEFAULT NULL,
  
  -- 完整内容快照
  title VARCHAR(200) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  requirement_report TEXT DEFAULT NULL,
  thinking_points TEXT DEFAULT NULL,
  initial_prompt TEXT DEFAULT NULL,
  advice TEXT DEFAULT NULL,
  final_prompt TEXT NOT NULL,
  
  language VARCHAR(10) DEFAULT 'zh',
  format VARCHAR(10) DEFAULT 'markdown',
  tags VARCHAR(500) DEFAULT NULL,
  
  -- 用户提示词上下文（保存完整上下文）
  system_prompt TEXT DEFAULT NULL,
  conversation_history TEXT DEFAULT NULL,
  
  -- 版本元数据
  change_log TEXT DEFAULT NULL,
  change_summary VARCHAR(500) DEFAULT NULL,
  change_type VARCHAR(10) DEFAULT 'patch',
  created_by INTEGER DEFAULT NULL,
  parent_version_id INTEGER DEFAULT NULL,
  
  -- 统计
  use_count INTEGER DEFAULT 0,
  rollback_count INTEGER DEFAULT 0,
  content_size INTEGER DEFAULT 0,
  
  -- 标记
  is_auto_save INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_prompt_version ON prompt_versions(prompt_id, version_number);
CREATE INDEX IF NOT EXISTS idx_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_by ON prompt_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_versions_create_time ON prompt_versions(create_time);

-- 标签表
CREATE TABLE IF NOT EXISTS prompt_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name VARCHAR(50) NOT NULL,
  user_id INTEGER NOT NULL,
  use_count INTEGER DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_tag ON prompt_tags(user_id, tag_name);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON prompt_tags(user_id);

-- 分享表
CREATE TABLE IF NOT EXISTS prompt_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id INTEGER NOT NULL,
  share_code VARCHAR(32) NOT NULL,
  expire_time DATETIME DEFAULT NULL,
  view_count INTEGER DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_share_code ON prompt_shares(share_code);
CREATE INDEX IF NOT EXISTS idx_shares_prompt_id ON prompt_shares(prompt_id);

-- 用户会话表 (可选,用于会话跟踪)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expire_time DATETIME NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expire_time ON user_sessions(expire_time);

-- 更新时间触发器 (SQLite不支持ON UPDATE CURRENT_TIMESTAMP)
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_prompts_timestamp 
AFTER UPDATE ON prompts
FOR EACH ROW
BEGIN
  UPDATE prompts SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
