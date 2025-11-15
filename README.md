# YPrompt

AI提示词生成与管理系统，支持`Linux.do OAuth`和本地用户认证，SQLite/MySQL双数据库。

## 功能特性

- AI引导式提示词生成（GPrompt四步法）
- 提示词优化与质量分析
- 版本管理与历史回滚
- 个人提示词库（标签、收藏）
- 双认证：`Linux.do OAuth` + 本地用户名密码
- 双数据库：SQLite（默认）+ MySQL（可选）
- 响应式设计（桌面/移动端）

## 界面

![](imgs/1.gif)

![](imgs/2.gif)

![](imgs/3.gif)

## 系统架构

```
YPrompt/
├── frontend/                  # Vue 3 + TypeScript 前端
│   └── dist/                 # 构建产物
├── backend/                   # Sanic Python 后端
│   ├── apps/                 # 应用代码
│   ├── config/               # 配置文件
│   └── migrations/           # 数据库脚本
├── data/                      # 数据目录（持久化）
│   ├── yprompt.db            # SQLite数据库
│   ├── cache/                # 缓存文件
│   ├── logs/                 # 日志文件
│   │   ├── backend/          # 后端日志
│   │   └── nginx/            # Nginx日志
│   └── ssl/                  # SSL证书（可选）
│       ├── fullchain.pem     # 证书链
│       └── privkey.pem       # 私钥
├── Dockerfile                 # Docker镜像
├── docker-compose.yml         # Docker Compose配置
└── start.sh                   # 容器启动脚本
```

## 快速启动

### Docker Run

```bash
docker run -d \
  --name yprompt \
  -p 80:80 \
  -v ./data:/app/data \
  -e DOMAIN=yourdomain.com \
  -e SECRET_KEY=your-random-secret-key \
  -e LINUX_DO_CLIENT_ID=your_client_id \
  -e LINUX_DO_CLIENT_SECRET=your_client_secret \
  -e LINUX_DO_REDIRECT_URI=https://yourdomain.com/auth/callback \
  ghcr.io/fish2018/yprompt:latest
```

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  yprompt:
    image: ghcr.io/fish2018/yprompt:latest
    container_name: yprompt
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data:/app/data
    environment:
      - DOMAIN=yourdomain.com
      - SECRET_KEY=your-random-secret-key
      - LINUX_DO_CLIENT_ID=your_client_id
      - LINUX_DO_CLIENT_SECRET=your_client_secret
      - LINUX_DO_REDIRECT_URI=https://yourdomain.com/auth/callback
```

启动：

```bash
docker-compose up -d
```

## 环境变量说明

### 必需参数

| 变量 | 说明 | 示例 |
|------|------|------|
| `SECRET_KEY` | JWT密钥（至少32位随机字符） | `a1b2c3d4e5f6...` |

### 服务器配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DOMAIN` | `localhost` | 域名或IP地址 |

### 数据库配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_TYPE` | `sqlite` | 数据库类型：`sqlite` 或 `mysql` |
| `SQLITE_DB_PATH` | `../data/yprompt.db` | SQLite数据库文件路径 |
| `DB_HOST` | `localhost` | MySQL主机地址 |
| `DB_USER` | `root` | MySQL用户名 |
| `DB_PASS` | - | MySQL密码 |
| `DB_NAME` | `yprompt` | MySQL数据库名 |
| `DB_PORT` | `3306` | MySQL端口 |

### `Linux.do OAuth`配置（可选）

| 变量 | 说明 | 示例 |
|------|------|------|
| `LINUX_DO_CLIENT_ID` | 应用Client ID | `WMYxs1aE2NOdBkj1le...` |
| `LINUX_DO_CLIENT_SECRET` | 应用Client Secret | `QGl30etmvXbLM0d...` |
| `LINUX_DO_REDIRECT_URI` | OAuth回调地址 | `https://yourdomain.com/auth/callback` |

申请地址：https://connect.linux.do/my/preferences/apps

### 本地认证配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ADMIN_USERNAME` | `admin` | 默认管理员用户名 |
| `ADMIN_PASSWORD` | `admin123` | 默认管理员密码 |

### 健康检查配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `HEALTH_CHECK_INTERVAL` | `30` | 健康检查间隔（秒） |
| `HEALTH_CHECK_TIMEOUT` | `10` | 健康检查超时（秒） |
| `HEALTH_CHECK_RETRIES` | `3` | 健康检查重试次数 |

## HTTPS配置

将SSL证书放置在数据目录：

```bash
data/ssl/
├── fullchain.pem    # 完整证书链
└── privkey.pem      # 私钥
```

容器启动时会自动检测并启用HTTPS。

## 许可证

MIT License