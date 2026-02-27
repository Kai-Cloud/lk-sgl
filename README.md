# 简单游戏大厅

适合小学生的网页益智游戏合集，支持 iPad 触屏操作和离线游玩。

## 游戏列表

- **数字华容道** — 滑动数字方块，按顺序排列。包含 9 个关卡（3x3 / 4x4 / 5x5），完成后获得星星评价。
- **记忆翻牌** — 翻开卡片找到相同的一对，训练记忆力。包含 9 个关卡（2x2 到 6x6），根据翻牌次数获得星星评价。
- **速算挑战** — 限时算术题挑战，涵盖加减乘除。包含 9 个关卡，根据正确率获得星星评价。
- **古诗背诵** — 跟读、填空、默写三阶段递进，轻松背会 13 首部编版四年级下册古诗词。支持语音朗读（Web Speech API）。

## 使用方式

用浏览器打开 `index.html` 即可游玩，无需安装任何依赖。

支持添加到 iPad 主屏幕作为独立应用使用（PWA）。

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 游戏大厅主页 |
| `sliding-puzzle.html` | 数字华容道游戏 |
| `memory-game.html` | 记忆翻牌游戏 |
| `math-challenge.html` | 速算挑战游戏 |
| `poetry-game.html` | 古诗背诵游戏 |
| `style.css` | 全局样式 |
| `sw.js` | Service Worker（离线缓存） |
| `manifest.json` | PWA 配置 |

## 局域网部署

确保电脑已安装 [Node.js](https://nodejs.org/)，然后在项目目录下运行：

```bash
npx serve -l 3000
```

终端会显示局域网地址，例如 `http://192.168.x.x:3000`。让同一 Wi-Fi 下的 iPad 或手机用浏览器打开该地址即可游玩。

在 iPad Safari 中点击"分享 → 添加到主屏幕"可保存为离线应用。

## 兼容性

- 兼容老款 iPad（iOS 10+）
- 不依赖任何框架或构建工具
- 触屏和鼠标均可操作

## 与 simple-lan-chat 集成

本项目可作为 [simple-lan-chat (slc)](https://github.com/Kai-Cloud/lk-slc) 的游戏插件。集成后用户在聊天界面即可看到"游戏大厅"bot，点击进入游玩，游戏进度自动保存。

### 部署要求

lk-sgl 和 slc **必须部署在同一台服务器**，且为 sibling 目录：

```
/home/user/
├── lk-slc/          # simple-lan-chat
└── lk-sgl/          # 本项目（游戏文件 + game-bot）
```

### 安装步骤

```bash
# 1. 克隆项目（与 lk-slc 同级目录）
cd ~
git clone https://github.com/Kai-Cloud/lk-sgl.git

# 2. 安装 game-bot 依赖
cd lk-sgl/game-bot
npm install

# 3. 配置 game-bot
cp .env.example .env
# 编辑 .env，填入 SERVER_URL 和 BOT_PASSWORD

# 4. 启动 game-bot
node index.js
```

### 使用 PM2 持久化运行

```bash
# 安装 PM2（如未安装）
npm install -g pm2

# 启动 game-bot
cd ~/lk-sgl/game-bot
pm2 start index.js --name game-bot

# 开机自启
pm2 save
pm2 startup
```
