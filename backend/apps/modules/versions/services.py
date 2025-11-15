"""
版本管理服务类
处理提示词版本管理的核心业务逻辑
"""
import json
import datetime
from sanic.log import logger


class VersionService:
    """版本管理服务类"""
    
    def __init__(self, db):
        """
        初始化版本服务
        
        Args:
            db: 数据库连接对象(ezmysql ConnectionAsync)
        """
        self.db = db
    
    # ============ 辅助方法 ============
    
    @staticmethod
    def generate_next_version(current_version: str, change_type: str) -> str:
        """
        生成下一个版本号
        
        Args:
            current_version: 当前版本号，如 "1.2.3"
            change_type: 变更类型 "major" | "minor" | "patch"
        
        Returns:
            新版本号
        """
        try:
            major, minor, patch = map(int, current_version.split('.'))
            
            if change_type == 'major':
                return f"{major + 1}.0.0"
            elif change_type == 'minor':
                return f"{major}.{minor + 1}.0"
            else:  # patch
                return f"{major}.{minor}.{patch + 1}"
        except Exception as e:
            logger.error(f'❌ 版本号生成失败: {e}')
            return '1.0.1'  # 默认递增
    
    @staticmethod
    def compare_version_numbers(v1: str, v2: str) -> int:
        """
        比较两个版本号
        
        Returns:
            1: v1 > v2
            0: v1 == v2
            -1: v1 < v2
        """
        try:
            v1_parts = list(map(int, v1.split('.')))
            v2_parts = list(map(int, v2.split('.')))
            
            for i in range(3):
                if v1_parts[i] > v2_parts[i]:
                    return 1
                elif v1_parts[i] < v2_parts[i]:
                    return -1
            
            return 0
        except:
            return 0
    
    # ============ 核心业务方法 ============
    
    async def create_version(self, prompt_id: int, user_id: int, data: dict):
        """
        创建新版本（保存当前版本到历史）
        
        Args:
            prompt_id: 提示词ID
            user_id: 用户ID
            data: 版本数据
                - change_type: 变更类型 major/minor/patch
                - change_summary: 变更摘要（必填）
                - change_log: 详细说明（可选）
                - version_tag: 版本标签（可选）
        
        Returns:
            dict: {version_id, version_number, create_time}
        """
        try:
            # 1. 获取当前提示词
            current_sql = f"SELECT * FROM prompts WHERE id = {prompt_id} AND user_id = {user_id}"
            current_prompt = await self.db.get(current_sql)
            
            if not current_prompt:
                raise ValueError('提示词不存在或无权限')
            
            # 2. 生成新版本号
            change_type = data.get('change_type', 'patch')
            current_version = current_prompt.get('current_version', '1.0.0')
            new_version = self.generate_next_version(current_version, change_type)
            
            # 3. 准备版本数据（完整快照）
            version_data = {
                'prompt_id': prompt_id,
                'version_number': new_version,
                'version_type': 'manual',
                'version_tag': data.get('version_tag', None),
                
                # 内容快照
                'title': current_prompt['title'],
                'description': current_prompt.get('description', ''),
                'requirement_report': current_prompt.get('requirement_report', ''),
                'thinking_points': current_prompt.get('thinking_points', ''),
                'initial_prompt': current_prompt.get('initial_prompt', ''),
                'advice': current_prompt.get('advice', ''),
                'final_prompt': current_prompt.get('final_prompt', ''),
                'language': current_prompt.get('language', 'zh'),
                'format': current_prompt.get('format', 'markdown'),
                'tags': current_prompt.get('tags', ''),
                
                # 用户提示词上下文（保存完整上下文）
                'system_prompt': current_prompt.get('system_prompt', ''),
                'conversation_history': current_prompt.get('conversation_history', ''),
                
                # 元数据
                'change_log': data.get('change_log', ''),
                'change_summary': data.get('change_summary', '版本更新'),
                'change_type': change_type,
                'created_by': user_id,
                'content_size': len(current_prompt.get('final_prompt', ''))
            }
            
            # 4. 插入版本表
            version_id = await self.db.table_insert('prompt_versions', version_data)
            
            # 5. 更新主表版本信息
            current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            update_sql = (
                "UPDATE prompts " 
                "SET current_version = '" + new_version + "', "
                "total_versions = total_versions + 1, "
                "last_version_time = '" + current_time + "' "
                "WHERE id = " + str(prompt_id)
            )
            await self.db.execute(update_sql)
            
            logger.info(f'✅ 版本创建成功: prompt_id={prompt_id}, version={new_version}')
            
            return {
                'version_id': version_id,
                'version_number': new_version,
                'create_time': current_time
            }
            
        except Exception as e:
            logger.error(f'❌ 创建版本失败: {e}')
            raise
    
    async def get_version_history(self, prompt_id: int, user_id: int, 
                                  page=1, limit=20, version_tag=None):
        """
        获取版本历史列表
        
        Args:
            prompt_id: 提示词ID
            user_id: 用户ID
            page: 页码
            limit: 每页数量
            version_tag: 版本标签筛选（可选）
        
        Returns:
            dict: {total, page, limit, items}
        """
        try:
            # 1. 验证权限
            check_sql = f"SELECT id FROM prompts WHERE id = {prompt_id} AND user_id = {user_id}"
            exists = await self.db.get(check_sql)
            
            if not exists:
                raise ValueError('提示词不存在或无权限')
            
            # 2. 构建WHERE条件
            where_conditions = [
                f"v.prompt_id = {prompt_id}",
                "v.is_deleted = 0"
            ]
            
            if version_tag:
                where_conditions.append(f"v.version_tag = '{version_tag}'")
            
            where_clause = " AND ".join(where_conditions)
            
            # 3. 计算偏移量
            offset = (page - 1) * limit if page > 0 else 0
            
            # 4. 查询总数
            count_sql = f"""
                SELECT COUNT(*) as total 
                FROM prompt_versions v
                WHERE {where_clause}
            """
            count_result = await self.db.get(count_sql)
            total = count_result['total'] if count_result else 0
            
            # 5. 查询版本列表（包含作者信息）
            list_sql = f"""
                SELECT 
                    v.id, v.version_number, v.version_tag, v.version_type,
                    v.change_summary, v.content_size, v.use_count,
                    v.created_by, v.create_time,
                    u.name as author_name,
                    u.avatar as author_avatar
                FROM prompt_versions v
                LEFT JOIN users u ON v.created_by = u.id
                WHERE {where_clause}
                ORDER BY v.create_time DESC
                LIMIT {limit} OFFSET {offset}
            """
            
            items = await self.db.query(list_sql)
            
            # 6. 格式化时间
            for item in items:
                item['create_time'] = str(item['create_time']) if item.get('create_time') else ''
                item['author_avatar'] = item.get('author_avatar', '')
            
            logger.debug(f'✅ 查询版本列表成功: prompt_id={prompt_id}, total={total}')
            
            return {
                'total': total,
                'page': page,
                'limit': limit,
                'items': items
            }
            
        except Exception as e:
            logger.error(f'❌ 查询版本列表失败: {e}')
            raise
    
    async def get_version_detail(self, prompt_id: int, user_id: int, version_id: int):
        """
        获取版本详情
        
        Args:
            prompt_id: 提示词ID
            user_id: 用户ID
            version_id: 版本ID
        
        Returns:
            dict: 版本详情
        """
        try:
            # 1. 验证权限并获取版本
            sql = f"""
                SELECT v.*, u.name as author_name, u.avatar as author_avatar
                FROM prompt_versions v
                LEFT JOIN users u ON v.created_by = u.id
                INNER JOIN prompts p ON v.prompt_id = p.id
                WHERE v.id = {version_id} 
                  AND v.prompt_id = {prompt_id}
                  AND p.user_id = {user_id}
                  AND v.is_deleted = 0
            """
            
            version = await self.db.get(sql)
            
            if not version:
                raise ValueError('版本不存在或无权限')
            
            # 2. 解析JSON字段
            if version.get('thinking_points'):
                try:
                    version['thinking_points'] = json.loads(version['thinking_points'])
                except:
                    version['thinking_points'] = []
            else:
                version['thinking_points'] = []
            
            if version.get('advice'):
                try:
                    version['advice'] = json.loads(version['advice'])
                except:
                    version['advice'] = []
            else:
                version['advice'] = []
            
            if version.get('tags'):
                version['tags'] = version['tags'].split(',') if version['tags'] else []
            else:
                version['tags'] = []
            
            # 3. 格式化时间
            version['create_time'] = str(version['create_time']) if version.get('create_time') else ''
            version['author_avatar'] = version.get('author_avatar', '')
            
            logger.debug(f'✅ 获取版本详情成功: version_id={version_id}')
            
            return version
            
        except Exception as e:
            logger.error(f'❌ 获取版本详情失败: {e}')
            raise
    
    async def compare_versions(self, prompt_id: int, user_id: int, 
                              from_version_id: int, to_version_id: int):
        """
        对比两个版本
        
        Args:
            prompt_id: 提示词ID
            user_id: 用户ID
            from_version_id: 源版本ID
            to_version_id: 目标版本ID
        
        Returns:
            dict: 对比结果
        """
        try:
            # 1. 获取两个版本
            from_version = await self.get_version_detail(prompt_id, user_id, from_version_id)
            to_version = await self.get_version_detail(prompt_id, user_id, to_version_id)
            
            # 2. 计算变更标记
            changes = {
                'title_changed': from_version['title'] != to_version['title'],
                'description_changed': from_version.get('description', '') != to_version.get('description', ''),
                'final_prompt_changed': from_version.get('final_prompt', '') != to_version.get('final_prompt', ''),
                'tags_changed': from_version.get('tags', '') != to_version.get('tags', '')
            }
            
            # 3. 构建对比结果
            result = {
                'from_version': {
                    'id': from_version['id'],
                    'version_number': from_version['version_number'],
                    'title': from_version['title'],
                    'description': from_version.get('description', ''),
                    'final_prompt': from_version.get('final_prompt', ''),
                    'tags': from_version.get('tags', []),
                    'create_time': from_version['create_time'],
                    'author_name': from_version.get('author_name', '')
                },
                'to_version': {
                    'id': to_version['id'],
                    'version_number': to_version['version_number'],
                    'title': to_version['title'],
                    'description': to_version.get('description', ''),
                    'final_prompt': to_version.get('final_prompt', ''),
                    'tags': to_version.get('tags', []),
                    'create_time': to_version['create_time'],
                    'author_name': to_version.get('author_name', '')
                },
                'changes': changes,
                'diff': {
                    # 简化的diff，前端可以使用更复杂的diff算法
                    'final_prompt': {
                        'from': from_version.get('final_prompt', ''),
                        'to': to_version.get('final_prompt', '')
                    }
                }
            }
            
            logger.debug(f'✅ 版本对比成功: from={from_version_id}, to={to_version_id}')
            
            return result
            
        except Exception as e:
            logger.error(f'❌ 版本对比失败: {e}')
            raise
    
    async def rollback_to_version(self, prompt_id: int, user_id: int, 
                                  version_id: int, change_summary=None):
        """
        回滚到指定版本
        
        Args:
            prompt_id: 提示词ID
            user_id: 用户ID
            version_id: 要回滚到的版本ID
            change_summary: 回滚说明（可选）
        
        Returns:
            dict: {new_version, rollback_to_version}
        """
        try:
            # 1. 获取目标版本
            target_version = await self.get_version_detail(prompt_id, user_id, version_id)
            
            # 2. 获取当前提示词信息
            current_sql = f"SELECT * FROM prompts WHERE id = {prompt_id} AND user_id = {user_id}"
            current_prompt = await self.db.get(current_sql)
            
            if not current_prompt:
                raise ValueError('提示词不存在或无权限')
            
            # 3. 先保存当前版本（作为回滚前的备份）
            backup_data = {
                'change_type': 'patch',
                'change_summary': change_summary or f'回滚前的备份（将回滚到 {target_version["version_number"]}）',
                'change_log': '自动创建的回滚前备份',
                'version_tag': 'pre-rollback'
            }
            # 注释掉备份逻辑，直接回滚更简洁
            # await self.create_version(prompt_id, user_id, backup_data)
            
            # 4. 将目标版本内容复制到主表
            def escape_sql_string(value):
                """转义SQL字符串中的特殊字符"""
                if value is None:
                    return ''
                s = str(value)
                s = s.replace("\\", "\\\\")
                s = s.replace("'", "''")
                s = s.replace("%", "%%")
                return s
            
            update_sql = f"""
                UPDATE prompts SET
                    title = '{escape_sql_string(target_version["title"])}',
                    description = '{escape_sql_string(target_version.get("description", ""))}',
                    requirement_report = '{escape_sql_string(target_version.get("requirement_report", ""))}',
                    thinking_points = '{escape_sql_string(target_version.get("thinking_points", ""))}',
                    initial_prompt = '{escape_sql_string(target_version.get("initial_prompt", ""))}',
                    advice = '{escape_sql_string(target_version.get("advice", ""))}',
                    final_prompt = '{escape_sql_string(target_version.get("final_prompt", ""))}',
                    language = '{escape_sql_string(target_version.get("language", "zh"))}',
                    format = '{escape_sql_string(target_version.get("format", "markdown"))}',
                    tags = '{escape_sql_string(target_version.get("tags", ""))}',
                    system_prompt = '{escape_sql_string(target_version.get("system_prompt", ""))}',
                    conversation_history = '{escape_sql_string(target_version.get("conversation_history", ""))}'
                WHERE id = {prompt_id}
            """
            await self.db.execute(update_sql)
            
            # 5. 直接更新主表版本号为目标版本（不创建新版本）
            target_version_num = target_version['version_number']
            update_version_sql = f"""
                UPDATE prompts 
                SET current_version = '{target_version_num}',
                    last_version_time = '{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}'
                WHERE id = {prompt_id}
            """
            await self.db.execute(update_version_sql)
            
            # 6. 更新被回滚版本的统计
            update_stats_sql = f"""
                UPDATE prompt_versions 
                SET rollback_count = rollback_count + 1,
                    use_count = use_count + 1
                WHERE id = {version_id}
            """
            await self.db.execute(update_stats_sql)
            
            logger.info(f'✅ 回滚成功: prompt_id={prompt_id}, to_version={target_version_num}')
            
            return {
                'new_version': target_version_num,
                'rollback_to_version': target_version_num
            }
            
        except Exception as e:
            logger.error(f'❌ 回滚失败: {e}')
            raise
    
    async def update_version_tag(self, prompt_id: int, user_id: int, 
                                version_id: int, version_tag: str):
        """
        更新版本标签
        
        Args:
            prompt_id: 提示词ID
            user_id: 用户ID
            version_id: 版本ID
            version_tag: 新标签
        
        Returns:
            bool: 是否成功
        """
        try:
            # 1. 验证权限
            check_sql = f"""
                SELECT v.id 
                FROM prompt_versions v
                INNER JOIN prompts p ON v.prompt_id = p.id
                WHERE v.id = {version_id} 
                  AND v.prompt_id = {prompt_id}
                  AND p.user_id = {user_id}
            """
            exists = await self.db.get(check_sql)
            
            if not exists:
                raise ValueError('版本不存在或无权限')
            
            # 2. 更新标签
            update_sql = f"""
                UPDATE prompt_versions 
                SET version_tag = '{version_tag}'
                WHERE id = {version_id}
            """
            await self.db.execute(update_sql)
            
            logger.info(f'✅ 更新版本标签成功: version_id={version_id}, tag={version_tag}')
            
            return True
            
        except Exception as e:
            logger.error(f'❌ 更新版本标签失败: {e}')
            raise
    
    async def delete_version(self, prompt_id: int, user_id: int, version_id: int):
        """
        删除版本（软删除）
        
        Args:
            prompt_id: 提示词ID
            user_id: 用户ID
            version_id: 版本ID
        
        Returns:
            bool: 是否成功
        """
        try:
            # 1. 获取版本信息
            version_sql = f"""
                SELECT v.*, p.current_version
                FROM prompt_versions v
                INNER JOIN prompts p ON v.prompt_id = p.id
                WHERE v.id = {version_id} 
                  AND v.prompt_id = {prompt_id}
                  AND p.user_id = {user_id}
                  AND v.is_deleted = 0
            """
            version = await self.db.get(version_sql)
            
            if not version:
                raise ValueError('版本不存在或无权限')
            
            # 2. 检查是否可以删除
            # 不允许删除 initial 版本
            if version.get('version_tag') == 'initial':
                raise ValueError('不能删除初始版本')
            
            # 不允许删除当前激活的版本
            if version.get('version_number') == version.get('current_version'):
                raise ValueError('不能删除当前激活的版本')
            
            # 3. 软删除
            delete_sql = f"""
                UPDATE prompt_versions 
                SET is_deleted = 1
                WHERE id = {version_id}
            """
            await self.db.execute(delete_sql)
            
            # 4. 更新主表版本数
            update_count_sql = f"""
                UPDATE prompts 
                SET total_versions = total_versions - 1
                WHERE id = {prompt_id}
            """
            await self.db.execute(update_count_sql)
            
            logger.info(f'✅ 删除版本成功: version_id={version_id}')
            
            return True
            
        except Exception as e:
            logger.error(f'❌ 删除版本失败: {e}')
            raise

