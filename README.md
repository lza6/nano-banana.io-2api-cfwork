
# 🍌 Nano-Banana 2API Cloudflare Worker 🚀

<div align="center">

![版本](https://img.shields.io/badge/版本-2.2.0_Visionary_Upgrade-FFBF00?style=for-the-badge)
![协议](https://img.shields.io/badge/许可证-GPL--3.0-important?style=for-the-badge)
![部署](https://img.shields.io/badge/部署-Cloudflare_Worker-blue?style=for-the-badge)

**✨ 世界上第一个将 Nano-Banana AI 图片放大服务转换为 OpenAI 兼容 API 的神奇工具 ✨**

[快速开始](#-懒人一键安装) • [使用教程](#-详细使用教程) • [技术原理](#-技术原理解密) • [贡献](#-一起让这个项目更好)

</div>

## 📖 目录
- [🎯 项目是什么？](#-项目是什么)
- [✨ 核心特性](#-核心特性)
- [🚀 懒人一键安装](#-懒人一键安装)
- [📚 详细使用教程](#-详细使用教程)
- [🔧 技术原理解密](#-技术原理解密)
- [🏗️ 项目架构](#️-项目架构)
- [⭐ 优缺点分析](#-优缺点分析)
- [🎯 适用场景](#-适用场景)
- [🔮 未来发展规划](#-未来发展规划)
- [📁 项目文件结构](#-项目文件结构)
- [🛠️ 技术栈详解](#️-技术栈详解)
- [🤝 贡献指南](#-一起让这个项目更好)
- [📄 许可证](#-许可证)
- [💝 致谢](#-致谢)

## 🎯 项目是什么？

> 🤔 **大白话解释**：这是一个"翻译官"程序，它能把标准的OpenAI API请求"翻译"成Nano-Banana网站能理解的语言，让你能用各种AI工具直接调用Nano-Banana的图片放大服务！

**技术定义**：这是一个部署在Cloudflare Worker上的无服务器应用，实现了OpenAI兼容的API接口，专门用于将Recraft AI的图像放大服务通过标准化API暴露给开发者。

### 🌟 哲学理念
我们相信：**技术应该服务于人，而不是让人服务于技术**。这个项目就是为了让复杂的AI服务变得简单易用，让每个开发者都能轻松享受高质量的图像处理能力！💫

## ✨ 核心特性

### 🎨 **视觉增强版 (Visionary Upgrade)**
- ✅ **完整OpenAI Vision协议支持** - 自动解析`content`数组中的`image_url`
- ✅ **Base64图片自动处理** - 客户端直接上传图片？我们帮你转存！
- ✅ **智能模型别名** - 使用`gpt-4o`等名称诱导客户端开启图片上传功能

### 🔌 **API兼容性**
- ✅ **OpenAI Images Edits端点** - 完全兼容`/v1/images/edits`
- ✅ **Chat Completions端点** - 支持`/v1/chat/completions`流式响应
- ✅ **Models列表端点** - 返回支持的模型列表

### 🎪 **开发者体验**
- ✅ **精美Web UI驾驶舱** - 拖拽上传、实时日志、进度展示
- ✅ **流式SSE响应** - 像ChatGPT一样的实时进度更新
- ✅ **CORS跨域支持** - 前端项目直接调用无压力

## 🚀 懒人一键安装

### 方法一：Cloudflare Dashboard部署 (推荐小白)
1. **点击这个按钮** 👉 [![部署到Cloudflare](https://button.deploy.cf/static/button.svg)](https://dash.cloudflare.com/?to=/:account/workers/services/add/create?template=https://github.com/lza6/nano-banana.io-2api-cfwork)
2. **登录/注册** Cloudflare账户
3. **一键部署**，等待魔法发生！✨
4. **复制你的Worker URL**，开始使用！

### 方法二：手动部署 (适合进阶用户)
```bash
# 1. 克隆这个神奇的仓库
git clone https://github.com/lza6/nano-banana.io-2api-cfwork.git
cd nano-banana.io-2api-cfwork

# 2. 安装Wrangler CLI
npm install -g wrangler

# 3. 登录Cloudflare
wrangler login

# 4. 部署！
wrangler deploy
```

### 🎯 5秒测试
部署完成后，访问你的Worker地址：
```
https://你的worker名称.你的子域名.workers.dev/
```
看到漂亮的香蕉驾驶舱？恭喜你！🎉 部署成功！

## 📚 详细使用教程

### 🖼️ 场景一：通过Web UI使用 (最适合人类👤)

1. **打开驾驶舱** - 访问你的Worker根路径
2. **上传图片** - 拖拽或点击上传区域
3. **点击放大** - 按下那个闪亮的"开始放大"按钮
4. **等待魔法** - 观看实时日志和进度条
5. **下载成果** - 获得4K高清大图！📸

### 🔌 场景二：通过API使用 (最适合程序🤖)

#### 方法A：cURL命令 (传统但强大)
```bash
curl https://你的worker.workers.dev/v1/images/edits \
  -H "Authorization: Bearer 1" \
  -F "image=@你的图片.jpg"
```

#### 方法B：OpenAI SDK (现代而优雅)
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://你的worker.workers.dev/v1',
  apiKey: '1', // 对，就是数字1，就这么简单！
});

const response = await client.images.edit({
  image: await fetch('本地图片路径'),
});
```

#### 方法C：Chat Completions API (最灵活)
```javascript
// 支持Base64图片直接上传！
const response = await fetch('https://你的worker.workers.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "gpt-4o", // 使用这个模型名可以开启图片上传功能
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..." // 你的Base64图片
            }
          }
        ]
      }
    ],
    stream: true
  })
});
```

### 🛠️ 场景三：集成到现有项目

#### Cherry AI Studio配置：
```yaml
base_url: https://你的worker.workers.dev/v1
api_key: 1
model: gpt-4o  # 这个模型名会启用图片上传按钮！
```

#### 自定义前端集成：
```javascript
// 1. 上传图片
const uploadForm = new FormData();
uploadForm.append('file', imageFile);
const uploadResp = await fetch('/proxy/upload', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer 1' },
  body: uploadForm
});

// 2. 提交任务
const generateResp = await fetch('/proxy/generate', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer 1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ image_url: uploadResp.data.url })
});

// 3. 轮询状态
const statusResp = await fetch(`/proxy/status?taskId=${generateResp.taskId}`, {
  headers: { 'Authorization': 'Bearer 1' }
});
```

## 🔧 技术原理解密

### 🎪 整体架构：魔法是如何发生的？

```
你的请求 (OpenAI格式) 
    ↓
Cloudflare Worker (我们的翻译官)
    ↓ 协议转换 + 身份伪装
Nano-Banana网站 (真实服务)
    ↓ 图片放大魔法
高清结果 (4K图片)
```

### 🔍 核心技术点详解

#### 1. **协议转换层 (Protocol Translation Layer)**
```javascript
// 当收到OpenAI格式请求时：
async function handleChatCompletions(request) {
  // 步骤1: 解析Vision协议
  const imageUrl = extractImageUrlFromOpenAIMessage(messages);
  
  // 步骤2: Base64自动处理
  if (imageUrl.startsWith('data:')) {
    imageUrl = await uploadBase64Image(imageUrl);
  }
  
  // 步骤3: 转换为Nano-Banana格式并执行
  return executeNanoBananaUpscale(imageUrl);
}
```

#### 2. **身份伪装系统 (Identity Camouflage System)**
```javascript
// 使用真实浏览器的身份信息
const CAMOUFLAGE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0... Chrome/142.0.0.0 Safari/537.36',
  'Origin': 'https://nano-banana.io',
  'Cookie': '那个很长的魔法字符串...' // 🍪 维持登录状态
};
```

#### 3. **智能路由系统 (Smart Routing)**
- **`/v1/images/edits`** → 文件上传直接放大
- **`/v1/chat/completions`** → Vision协议解析 + 流式响应  
- **`/v1/models`** → 返回模型列表(包含诱导性模型名)

#### 4. **流式响应引擎 (Streaming Response Engine)**
```javascript
// 创建TransformStream实现实时进度更新
const { readable, writable } = new TransformStream();
const writer = writable.getWriter();

// 异步处理任务，实时推送状态
(async () => {
  await sendSSE(writer, "正在上传图片...");
  await sendSSE(writer, "提交放大任务...");
  // ... 更多状态更新
})();
```

### 🎯 关键变量解释

| 变量名 | 类型 | 作用 | 示例 |
|--------|------|------|------|
| `CONFIG.UPSTREAM_ORIGIN` | String | 上游服务地址 | `"https://nano-banana.io"` |
| `CONFIG.COOKIE` | String | 维持登录状态的魔法饼干 | `"__Host-authjs.csrf-token=..."` |
| `CONFIG.MODELS` | Array | 支持的模型列表(包含诱导名) | `["gpt-4o", "recraft-upscale"]` |
| `targetImageUrl` | String | 目标图片URL(自动处理Base64) | `"https://..."` 或 `"data:image/..."` |

### 🔄 任务执行流程

1. **请求解析** → 识别图片URL/Base64数据
2. **预处理** → Base64转存为可访问URL  
3. **任务提交** → 调用Nano-Banana生成接口
4. **状态轮询** → 定期检查任务进度
5. **结果返回** → 流式推送或直接返回图片URL

## 🏗️ 项目架构

```
nano-banana-2api-cloudflare-worker/
├── 🎪 前端展示层 (Web UI)
│   ├── 开发者驾驶舱 (可视化操作界面)
│   ├── 实时日志系统 (执行过程可视化)
│   └── 拖拽上传组件 (用户体验优化)
│
├── 🔌 API网关层 (协议转换)
│   ├── OpenAI兼容端点 (/v1/*)
│   ├── 内部代理端点 (/proxy/*) 
│   └── CORS跨域处理 (浏览器兼容)
│
├── 🔄 业务逻辑层 (核心处理)
│   ├── Vision协议解析器 (content数组处理)
│   ├── Base64转码器 (DataURL → 文件上传)
│   ├── 任务状态轮询器 (定期检查进度)
│   └── 流式响应生成器 (SSE实时更新)
│
└── 🚀 基础设施层 (Cloudflare平台)
    ├── 无服务器运行时 (Worker环境)
    ├── 全局边缘网络 (低延迟访问)
    └── 密钥安全管理 (环境变量)
```

## ⭐ 优缺点分析

### 🌟 优势亮点

1. **🚀 极简部署** - 一键部署，5分钟即可使用
2. **🎯 完全兼容** - 支持所有OpenAI生态工具
3. **🆓 成本友好** - Cloudflare Worker免费额度足够个人使用
4. **🎨 用户体验** - 精美的Web界面 + 实时进度展示
5. **🔧 技术先进** - 流式响应、Base64自动处理、Vision协议支持

### ⚠️ 局限性与注意事项

1. **🔐 凭证依赖** - 需要有效的Nano-Banana登录Cookie
2. **📊 服务限制** - 依赖上游服务的可用性和限制
3. **⏳ 异步处理** - 图片放大需要等待时间(1-3分钟)
4. **🛡️ 安全考虑** - API密钥目前为简单验证

### 🔄 技术债与改进空间

- [ ] **身份验证增强** - 实现JWT或OAuth2.0
- [ ] **错误处理优化** - 更友好的错误消息和重试机制  
- [ ] **缓存系统** - 减少重复上传和计算
- [ ] **监控指标** - 性能监控和用量统计
- [ ] **多服务支持** - 扩展到其他AI服务提供商

## 🎯 适用场景

### 🤖 开发者集成
- **AI应用开发** - 为你的App添加图片放大功能
- **工作流自动化** - 批量处理图片资源
- **产品功能扩展** - 低成本增加AI能力

### 👨‍💻 个人使用
- **摄影后期** - 提升手机照片画质
- **设计素材** - 放大低分辨率图片
- **内容创作** - 为博客、社交媒体准备高清图片

### 🏢 企业应用
- **电商平台** - 商品图片高清化
- **媒体出版** - 历史图片修复
- **教育培训** - 教学材料质量提升

## 🔮 未来发展规划

### 🎯 短期目标 (v2.3.0 - 下一个版本)
- [ ] **多服务支持** - 添加更多AI图片服务提供商
- [ ] **批量处理** - 同时处理多张图片
- [ ] **格式扩展** - 支持WebP、AVIF等现代格式

### 🚀 中期规划 (v3.0.0)  
- [ ] **插件系统** - 可插拔的服务提供商支持
- [ ] **分布式处理** - 多个服务商并行处理
- [ ] **智能路由** - 自动选择最佳服务提供商

### 🌟 长期愿景
- [ ] **AI服务聚合平台** - 统一的AI能力网关
- [ ] **智能优化** - 基于内容的自动参数调整
- [ ] **生态系统** - 第三方插件和扩展市场

## 📁 项目文件结构

```
nano-banana-2api-cfwork/
├── 📄 README.md                    # 你现在正在看的这个神奇文档
├── 📄 LICENSE                      # GPL-3.0开源协议文件
├── 🚀 worker.js                    # 核心Cloudflare Worker代码
├── 🎨 config.js                    # 配置文件(已合并到worker.js)
├── 📊 package.json                 # 项目依赖和元数据
├── 🔧 wrangler.toml                # Cloudflare Wrangler配置
├── 📁 docs/                        # 详细文档目录
│   ├── API_REFERENCE.md            # 完整API参考
│   ├── DEPLOYMENT_GUIDE.md         # 部署指南
│   └── TROUBLESHOOTING.md          # 故障排除
├── 📁 examples/                    # 使用示例代码
│   ├── frontend-integration/       # 前端集成示例
│   ├── api-clients/                # 各种语言客户端示例
│   └── automation-scripts/         # 自动化脚本示例
└── 📁 tests/                       # 测试相关文件
    ├── unit-tests/                 # 单元测试
    ├── integration-tests/          # 集成测试
    └── test-data/                  # 测试数据
```

## 🛠️ 技术栈详解

### 🌐 核心平台
- **Cloudflare Workers** ⭐⭐⭐⭐⭐ (部署难度: 简单)
  - 边缘计算平台，全球低延迟
  - 搜索关键词: "Cloudflare Worker tutorial"

### 💻 编程语言  
- **JavaScript (ES6+)** ⭐⭐⭐⭐⭐ (掌握难度: 简单)
  - 现代JavaScript特性：箭头函数、async/await、解构赋值
  - 搜索关键词: "JavaScript ES6 features"

### 🔧 关键技术点

#### 1. **Fetch API处理** ⭐⭐⭐⭐☆
```javascript
// 关键技术：请求转发和响应处理
const response = await fetch(upstreamUrl, {
  method: 'POST',
  headers: camouflageHeaders, // 身份伪装
  body: request.body
});
```
**搜索词**: "JavaScript Fetch API advanced usage"

#### 2. **Streams API** ⭐⭐⭐⭐☆
```javascript
// 关键技术：流式响应处理
const { readable, writable } = new TransformStream();
// 实时数据推送能力
```
**搜索词**: "JavaScript Streams API tutorial"

#### 3. **FormData处理** ⭐⭐⭐☆☆
```javascript
// 关键技术：文件上传处理
const formData = new FormData();
formData.append('image', imageFile);
```
**搜索词**: "JavaScript FormData file upload"

#### 4. **Base64编解码** ⭐⭐⭐☆☆
```javascript
// 关键技术：DataURL转文件对象
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const bstr = atob(arr[1]); // Base64解码
  // ... 转换为File对象
}
```
**搜索词**: "JavaScript Base64 to File conversion"

### 🎨 前端技术
- **HTML5 Drag & Drop** ⭐⭐⭐☆☆
- **Server-Sent Events (SSE)** ⭐⭐⭐⭐☆  
- **CSS3 Flexbox/Grid** ⭐⭐⭐☆☆

### 🔄 进阶技术建议

对于想要深入理解的开发者，建议研究：

1. **反向代理模式** - 深入了解HTTP请求转发
2. **中间件架构** - 如何设计可扩展的请求处理管道  
3. **边缘计算优化** - 利用Cloudflare全球网络的优势
4. **无状态设计** - 在Serverless环境下的最佳实践

## 🤝 一起让这个项目更好

我们相信：**开源的本质是分享，分享的本质是进步**！🎉

### 🎯 如何贡献？

#### 1. **代码贡献** 👨‍💻
- 修复bug、添加新功能、优化性能
- 遵循现有的代码风格和架构模式

#### 2. **文档改进** 📚  
- 完善使用教程、添加示例代码
- 翻译多语言文档、改进文档结构

#### 3. **测试验证** 🧪
- 编写单元测试和集成测试
- 在不同环境下测试兼容性

#### 4. **创意分享** 💡
- 提出新功能建议、使用场景
- 分享你的集成经验和案例

### 🔧 开发环境设置

```bash
# 1. 克隆仓库
git clone https://github.com/lza6/nano-banana.io-2api-cfwork.git

# 2. 安装依赖
npm install

# 3. 本地开发
wrangler dev

# 4. 运行测试
npm test
```

### 🐛 问题反馈

发现bug？有改进建议？请通过[GitHub Issues](https://github.com/lza6/nano-banana.io-2api-cfwork/issues)告诉我们！

## 📄 许可证

本项目采用 **GPL-3.0许可证** - 参见 [LICENSE](LICENSE) 文件了解详情。

**简单理解**：你可以自由使用、修改、分发这个软件，但如果你分发修改后的版本，也必须开源你的修改。这就是开源的"传染性"魔法！✨

## 💝 致谢

### 🙏 感谢以下技术和服务

- **Cloudflare** - 提供优秀的边缘计算平台
- **Nano-Banana** - 提供高质量的图片放大服务  
- **OpenAI** - 制定优秀的API设计标准
- **开源社区** - 每一位使用和贡献这个项目的人

### 🌟 特别鸣谢

感谢**你** - 正在阅读这个文档的开发者！因为你的关注和参与，开源世界才变得更加美好！🚀

---

<div align="center">

**如果这个项目帮助了你，请给它一个⭐星标支持！**

![星标增长图](https://api.star-history.com/svg?repos=lza6/nano-banana.io-2api-cfwork&type=Date)

**✨ 让技术服务于每一个人 ✨**

</div>
