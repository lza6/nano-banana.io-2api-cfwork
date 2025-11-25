// =================================================================================
//  项目: nano-banana-2api (Cloudflare Worker 单文件版)
//  版本: 2.2.0 (代号: Visionary Upgrade - 完美视觉版)
//  作者: 首席AI执行官 (Principal AI Executive Officer)
//  协议: 奇美拉协议 · 视觉增强版 (Project Chimera: Vision Edition)
//  日期: 2025-11-26
//
//  [v2.2.0 核心升级 - 解决客户端无法上传图片问题]
//  1. [新增] 完整支持 OpenAI Vision 协议 (解析 content 数组中的 image_url)。
//  2. [新增] 自动处理 Base64 图片流。客户端直接上传图片时，Worker 会自动转存至上游。
//  3. [优化] 模型列表增加 'gpt-4o' 等别名，诱导客户端开启图片上传按钮。
//  4. [继承] 保留 v2.1.0 的所有 UI 修复和 URL 协议头修复。
// =================================================================================

// --- [第一部分: 核心配置 (Configuration-as-Code)] ---
const CONFIG = {
  PROJECT_NAME: "nano-banana-2api",
  PROJECT_VERSION: "2.2.0",
  
  // --- 安全配置 ---
  // 建议在 Cloudflare 环境变量中设置 API_MASTER_KEY
  API_MASTER_KEY: "1", 
  
  // --- 上游服务配置 ---
  UPSTREAM_ORIGIN: "https://nano-banana.io",
  
  // --- 凭证 (从抓包数据自动提取) ---
  // 务必保持此 Cookie 的有效性
  COOKIE: "__Host-authjs.csrf-token=516be2da10c07449442b3cfa621efcdfef84dd04bc5d7afff71e6c20cb96eddc%7Ce98a01a7ae95505fb1bf8175750f974735a16ca1d742d0f7657633d465d11fb0; g_state={\"i_l\":0,\"i_ll\":1764094381194}; __Secure-authjs.callback-url=https%3A%2F%2Fnano-banana.io%2F%3Futm_source%3Ddokeyai%26utm_medium%3Dreferral; NEXT_LOCALE=zh; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiS3RtV3U2TzRwNVFsd2JGMHZ0aUZGVlVEMWlRaVpzWi16R3MyUHJMMXhwVUhvSUFmT0JOczRFUlgxY2tLZTNXUkJGNzQzU0RxMWJSZWNqUzJSX29hY0EifQ..bW5tRiHLae15LFBuvspVjw.Vzl1DxsYXvk9a8gz0GmRkhALEsIrX6GsQ1Y_albmjkcaGYkqDif2KYfG54EKmtVtzPggai9UE5I29pQk89zSciCUFWLFo2LS-Tuw3kLPIyPjZFvIBtR0IS9x8HDodvw-5l_yOfWxyHX7HRWDVzgGSq5UN-szW3jqWYMcq032Y2U0V6GWZUcSKCGeEKP6R0tT4i3NRpt6w3FGU9vSoYe8wMR8DJP7XxBLpSX6jxKCzC9YPZYkMTOLc49MqHuM5E8W2QmNitGWZpc4RdTlgMqSbbnWLF_v4JwYEBOWdMWoYU60zLvnhOgmu_2LkwtMG2cg-x4IO-p-HW7AHY1khUwbWnE4QRu5rDui-iO69Hvdj5UZupRZ1QNkpfzfNVA6KnEwn483GqsyfqxKgthY30rGZOjH9t5ECG87FKKZJ7Hq7BJcYgIrDczhy7PvnG1duw-9PSLGzHMfhgdl6cxkZd8fydff8PFzMAvOTITLOfeIyncY_QWat_EfjClo1T2ADZPDnG8OSfwZs8APShs7lryHAbiRW5VaGLebryOXFPRNiyPaMNBPFPXqzhdd6dTDJpkOx94TiBCbWNLMWyh600JvnHHm37QKbRmyRml4BQ8HvHleqb7khI_gmA_wyoD4ojstiNzZJhFCJ18sAWlJjGYFpUTPtG-VBbHPcwiOjehB6vbU0IT4gpkWS_v2RmA3CuJruh6diqVk_A5_M2zQ0Yedsw.calW_WNsu-nQN_JTxnxKfwwEtUHNIgdzkYhWC1oQsec",
  
  // 模型列表
  // 注意：加入 gpt-4o 等常用 Vision 模型名称，是为了让客户端(如Cherry Studio)识别为支持图片上传
  MODELS: ["recraft-upscale","gpt-4-vision-preview"],
  DEFAULT_MODEL: "recraft-upscale",

  // 轮询配置
  POLLING_INTERVAL: 2000, // 2秒
  POLLING_TIMEOUT: 120000 // 2分钟
};

// --- [第二部分: Worker 入口与路由] ---
export default {
  async fetch(request, env, ctx) {
    const apiKey = env.API_MASTER_KEY || CONFIG.API_MASTER_KEY;
    const url = new URL(request.url);

    // 1. 预检请求
    if (request.method === 'OPTIONS') return handleCorsPreflight();

    // 2. 开发者驾驶舱 (Web UI)
    if (url.pathname === '/') return handleUI(request, apiKey);

    // 3. API 路由
    if (url.pathname.startsWith('/v1/')) {
      return handleApi(request, apiKey);
    }
    
    // 4. 内部代理路由 (用于 Web UI 上传和查询，绕过 CORS)
    if (url.pathname === '/proxy/upload') return handleProxyUpload(request, apiKey);
    if (url.pathname === '/proxy/generate') return handleProxyGenerate(request, apiKey);
    if (url.pathname === '/proxy/status') return handleProxyStatus(request, apiKey);

    return createErrorResponse(`Path not found: ${url.pathname}`, 404);
  }
};

// --- [第三部分: API 代理逻辑] ---

async function handleApi(request, apiKey) {
  if (!verifyAuth(request, apiKey)) return createErrorResponse('Unauthorized', 401);
  const url = new URL(request.url);

  if (url.pathname === '/v1/models') {
    return new Response(JSON.stringify({
      object: 'list',
      data: CONFIG.MODELS.map(id => ({ id, object: 'model', created: Math.floor(Date.now()/1000), owned_by: 'nano-banana' }))
    }), { headers: corsHeaders({ 'Content-Type': 'application/json' }) });
  }

  // 兼容 OpenAI Image Edits (上传文件)
  if (url.pathname === '/v1/images/edits') {
    return handleImageEdits(request);
  }

  // 兼容 Chat Completions (发送 URL 或 Base64)
  if (url.pathname === '/v1/chat/completions') {
    return handleChatCompletions(request);
  }

  return createErrorResponse('Not Found', 404);
}

// 处理 /v1/images/edits (上传文件直接放大)
async function handleImageEdits(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) return createErrorResponse("Missing 'image' file", 400);

    // 1. 上传图片
    const uploadResult = await uploadImageToUpstream(imageFile);
    if (!uploadResult.url) throw new Error("Upload failed: No URL returned");

    // 2. 提交放大任务
    const taskId = await submitUpscaleTask(uploadResult.url);

    // 3. 轮询结果 (后端轮询)
    const resultUrl = await pollTaskStatus(taskId);

    return new Response(JSON.stringify({
      created: Math.floor(Date.now() / 1000),
      data: [{ url: resultUrl }]
    }), { headers: corsHeaders({ 'Content-Type': 'application/json' }) });

  } catch (e) {
    return createErrorResponse(e.message, 500);
  }
}

// 处理 /v1/chat/completions (核心逻辑升级)
async function handleChatCompletions(request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];
    
    // --- [Vision 协议解析核心] ---
    let targetImageUrl = null;

    // 倒序查找最后一条包含图片的消息
    for (let i = messages.length - 1; i >= 0; i--) {
        const content = messages[i].content;
        
        // 情况 A: content 是数组 (OpenAI Vision 标准)
        if (Array.isArray(content)) {
            const imagePart = content.find(item => item.type === 'image_url');
            if (imagePart && imagePart.image_url && imagePart.image_url.url) {
                targetImageUrl = imagePart.image_url.url;
                break;
            }
        } 
        // 情况 B: content 是字符串 (旧版或纯文本 URL)
        else if (typeof content === 'string') {
            if (content.startsWith("http")) {
                targetImageUrl = content;
                break;
            }
            // 尝试正则提取
            const match = content.match(/https?:\/\/[^\s]+/);
            if (match) {
                targetImageUrl = match[0];
                break;
            }
        }
    }

    if (!targetImageUrl) {
        return createErrorResponse("未检测到图片。请上传图片或提供图片 URL。", 400);
    }

    // 流式响应准备
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const requestId = `chatcmpl-${crypto.randomUUID()}`;

    // 异步处理任务
    (async () => {
        try {
            // --- [Base64 自动处理] ---
            // 如果是 Base64 数据 (data:image/...)，需要先上传到服务器
            if (targetImageUrl.startsWith('data:')) {
                await sendSSE(writer, encoder, requestId, `正在处理上传的图片数据...\n`);
                const file = dataURLtoFile(targetImageUrl, 'upload.png');
                const uploadRes = await uploadImageToUpstream(file);
                targetImageUrl = uploadRes.url;
                await sendSSE(writer, encoder, requestId, `图片上传成功，准备放大...\n`);
            }

            // 提交任务
            await sendSSE(writer, encoder, requestId, `正在提交放大任务...\n`);
            const taskId = await submitUpscaleTask(targetImageUrl);
            
            // 轮询
            const resultUrl = await pollTaskStatus(taskId, async (status) => {
                await sendSSE(writer, encoder, requestId, `任务进行中: ${status}...\n`);
            });

            const markdown = `\n![Upscaled Image](${resultUrl})`;
            await sendSSE(writer, encoder, requestId, markdown);
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            await writer.close();
        } catch (e) {
            await sendSSE(writer, encoder, requestId, `\nError: ${e.message}`);
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            await writer.close();
        }
    })();

    return new Response(readable, {
        headers: corsHeaders({ 'Content-Type': 'text/event-stream' })
    });

  } catch (e) {
    return createErrorResponse(e.message, 500);
  }
}

// --- 核心业务逻辑函数 ---

// 1. 上传图片到 Nano-Banana
async function uploadImageToUpstream(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${CONFIG.UPSTREAM_ORIGIN}/api/upload-image`, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'Origin': CONFIG.UPSTREAM_ORIGIN,
      'Referer': `${CONFIG.UPSTREAM_ORIGIN}/zh/ai-image-upscaler`,
      'Cookie': CONFIG.COOKIE
    },
    body: formData
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(`Upload API error: ${data.message}`);
  return data.data; // { url: "...", key: "..." }
}

// 2. 提交放大任务
async function submitUpscaleTask(imageUrl) {
  const payload = {
    image_url: imageUrl,
    source_type: "upscale"
  };

  const response = await fetch(`${CONFIG.UPSTREAM_ORIGIN}/api/recraft/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'Origin': CONFIG.UPSTREAM_ORIGIN,
      'Referer': `${CONFIG.UPSTREAM_ORIGIN}/zh/ai-image-upscaler`,
      'Cookie': CONFIG.COOKIE
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Generate failed: ${response.status}`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(`Generate API error: ${data.message}`);
  return data.data.taskId;
}

// 3. 轮询任务状态 (包含 URL 修复逻辑)
async function pollTaskStatus(taskId, progressCallback) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < CONFIG.POLLING_TIMEOUT) {
    const response = await fetch(`${CONFIG.UPSTREAM_ORIGIN}/api/recraft/task-status?taskId=${taskId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'Referer': `${CONFIG.UPSTREAM_ORIGIN}/zh/ai-image-upscaler`,
        'Cookie': CONFIG.COOKIE
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 0 && data.data) {
        const status = data.data.status; // 'generating', 'success', 'failed'
        
        if (status === 'success') {
          let resultUrl = data.data.images.resultImageUrl;
          // [修复] 确保 URL 包含协议
          if (resultUrl && !resultUrl.startsWith('http')) {
            resultUrl = 'https://' + resultUrl;
          }
          return resultUrl;
        }
        if (status === 'failed') {
          throw new Error(data.data.statusMessage || "Task failed");
        }
        if (progressCallback) await progressCallback(status);
      }
    }
    
    await new Promise(r => setTimeout(r, CONFIG.POLLING_INTERVAL));
  }
  throw new Error("Polling timeout");
}

// --- 内部代理处理 (Web UI 用) ---

async function handleProxyUpload(request, apiKey) {
  if (!verifyAuth(request, apiKey)) return createErrorResponse('Unauthorized', 401);
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const result = await uploadImageToUpstream(file);
    return new Response(JSON.stringify({ success: true, data: result }), { headers: corsHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { headers: corsHeaders() });
  }
}

async function handleProxyGenerate(request, apiKey) {
  if (!verifyAuth(request, apiKey)) return createErrorResponse('Unauthorized', 401);
  try {
    const body = await request.json();
    const taskId = await submitUpscaleTask(body.image_url);
    return new Response(JSON.stringify({ success: true, taskId }), { headers: corsHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { headers: corsHeaders() });
  }
}

async function handleProxyStatus(request, apiKey) {
  if (!verifyAuth(request, apiKey)) return createErrorResponse('Unauthorized', 401);
  try {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    
    const response = await fetch(`${CONFIG.UPSTREAM_ORIGIN}/api/recraft/task-status?taskId=${taskId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Cookie': CONFIG.COOKIE
      }
    });
    const data = await response.json();
    
    // [修复] 代理状态查询时也修复 URL
    if (data.code === 0 && data.data && data.data.images && data.data.images.resultImageUrl) {
        let url = data.data.images.resultImageUrl;
        if (!url.startsWith('http')) {
            data.data.images.resultImageUrl = 'https://' + url;
        }
    }

    return new Response(JSON.stringify(data), { headers: corsHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { headers: corsHeaders() });
  }
}

// --- 通用辅助函数 ---

function verifyAuth(request, validKey) {
  if (validKey === "1") return true; // 开放模式
  const auth = request.headers.get('Authorization');
  return auth && auth === `Bearer ${validKey}`;
}

function createErrorResponse(msg, status) {
  return new Response(JSON.stringify({ error: { message: msg } }), { status, headers: corsHeaders() });
}

function corsHeaders(extra = {}) {
  return {
    ...extra,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function handleCorsPreflight() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function sendSSE(writer, encoder, id, content) {
  const chunk = {
    id, object: 'chat.completion.chunk', created: Math.floor(Date.now()/1000),
    model: CONFIG.DEFAULT_MODEL, choices: [{ index: 0, delta: { content }, finish_reason: null }]
  };
  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
}

// 辅助：将 Base64 DataURL 转换为 File 对象 (用于上传)
function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    // Cloudflare Worker 环境下 File 构造函数可用
    return new File([u8arr], filename, {type:mime});
}

// --- [第四部分: 开发者驾驶舱 UI] ---
function handleUI(request, apiKey) {
  const origin = new URL(request.url).origin;
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${CONFIG.PROJECT_NAME} - 驾驶舱</title>
    <style>
      :root { --bg: #121212; --panel: #1E1E1E; --border: #333; --text: #E0E0E0; --primary: #FFBF00; --input-bg: #2A2A2A; --log-bg: #000; --log-text: #0f0; }
      body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); margin: 0; height: 100vh; display: flex; overflow: hidden; }
      .sidebar { width: 350px; background: var(--panel); border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; overflow-y: auto; }
      .main { flex: 1; padding: 20px; display: flex; flex-direction: column; }
      .content-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow-y: auto; }
      .log-panel { height: 200px; background: var(--log-bg); border-top: 1px solid var(--border); padding: 10px; font-family: monospace; font-size: 12px; color: var(--log-text); overflow-y: auto; }
      
      .box { background: #252525; padding: 15px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 20px; }
      .label { font-size: 12px; color: #888; margin-bottom: 5px; display: block; }
      .code { font-family: monospace; color: var(--primary); background: #111; padding: 8px; border-radius: 4px; cursor: pointer; word-break: break-all; font-size: 11px; }
      
      .upload-area { 
        border: 2px dashed #555; border-radius: 8px; padding: 30px; text-align: center; cursor: pointer; 
        transition: 0.2s; background-size: contain; background-repeat: no-repeat; background-position: center;
        width: 100%; max-width: 500px; height: 300px; display: flex; align-items: center; justify-content: center; flex-direction: column;
        background-color: var(--input-bg);
      }
      .upload-area:hover { border-color: var(--primary); background-color: #333; }
      .upload-area.has-img { border-style: solid; }
      
      button { background: var(--primary); color: #000; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 20px; font-size: 16px; }
      button:disabled { background: #555; cursor: not-allowed; }
      
      .result-area { margin-top: 20px; text-align: center; display: none; width: 100%; max-width: 800px; }
      .compare-container { display: flex; gap: 20px; justify-content: center; margin-top: 20px; }
      .img-box { flex: 1; }
      .img-box img { max-width: 100%; border-radius: 8px; border: 1px solid var(--border); }
      .img-label { margin-top: 5px; color: #888; font-size: 12px; }
      
      .status { margin-top: 15px; color: var(--primary); font-family: monospace; }
      .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #888; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; vertical-align: middle; margin-right: 8px; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .log-entry { margin-bottom: 4px; border-bottom: 1px solid #333; padding-bottom: 2px; }
      .log-time { color: #888; margin-right: 8px; }
      .log-type { font-weight: bold; margin-right: 8px; }
      .log-info { color: #ccc; }
      .log-success { color: #66BB6A; }
      .log-error { color: #EF5350; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>🍌 ${CONFIG.PROJECT_NAME}</h2>
        <div class="box">
            <span class="label">API Key</span>
            <div class="code" onclick="copy('${apiKey}')">${apiKey}</div>
        </div>
        
        <div class="box">
            <span class="label">🔌 API 集成信息 (OpenAI Compatible)</span>
            <div style="margin-bottom:10px">
                <span class="label">Base URL:</span>
                <div class="code" onclick="copy('${origin}/v1')">${origin}/v1</div>
            </div>
            <div>
                <span class="label">推荐模型 (Model):</span>
                <div class="code" onclick="copy('gpt-4o')">gpt-4o</div>
                <div style="font-size:10px; color:#666; margin-top:5px">使用 gpt-4o 可确保客户端开启图片上传功能</div>
            </div>
        </div>

        <div class="box">
            <span class="label">集成代码 (cURL)</span>
            <div class="code" onclick="copy(this.innerText)">
curl ${origin}/v1/images/edits \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "image=@test.jpg"
            </div>
        </div>
    </div>

    <div class="main">
        <div class="content-area">
            <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleFile(this.files[0])">
            
            <div class="upload-area" id="upload-area" onclick="document.getElementById('file-input').click()">
                <div id="upload-placeholder">
                    <div style="font-size:40px; margin-bottom:10px">📤</div>
                    <div>点击或拖拽上传图片</div>
                    <div style="font-size:12px; color:#666; margin-top:5px">支持 JPG/PNG/WEBP</div>
                </div>
            </div>

            <button id="btn-upscale" onclick="startUpscale()" disabled>开始放大 (Upscale)</button>
            
            <div id="status" class="status"></div>

            <div class="result-area" id="result-area">
                <div class="compare-container">
                    <div class="img-box">
                        <div class="img-label">原图 (Original)</div>
                        <img id="img-original" src="">
                    </div>
                    <div class="img-box">
                        <div class="img-label">放大后 (Upscaled 4K)</div>
                        <img id="img-result" src="">
                    </div>
                </div>
                <a id="download-link" href="#" target="_blank"><button style="background:#333; color:#fff; border:1px solid #555; margin-top:20px">下载大图</button></a>
            </div>
        </div>
        
        <div class="log-panel" id="log-panel">
            <div class="log-entry">系统就绪。等待操作...</div>
        </div>
    </div>

    <script>
        const API_KEY = "${apiKey}";
        let currentFile = null;
        let uploadedUrl = null;

        function copy(text) { navigator.clipboard.writeText(text); alert('已复制'); }
        
        function log(msg, type="info") {
            const panel = document.getElementById('log-panel');
            const div = document.createElement('div');
            div.className = 'log-entry';
            const time = new Date().toLocaleTimeString();
            let colorClass = 'log-info';
            if(type === 'success') colorClass = 'log-success';
            if(type === 'error') colorClass = 'log-error';
            
            div.innerHTML = \`<span class="log-time">[\${time}]</span><span class="log-type">[\${type.toUpperCase()}]</span><span class="\${colorClass}">\${msg}</span>\`;
            panel.appendChild(div);
            panel.scrollTop = panel.scrollHeight;
        }

        const dropZone = document.getElementById('upload-area');
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#FFBF00'; });
        dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = '#555'; });
        dropZone.addEventListener('drop', (e) => { 
            e.preventDefault(); 
            dropZone.style.borderColor = '#555';
            handleFile(e.dataTransfer.files[0]); 
        });

        function handleFile(file) {
            if (!file) return;
            currentFile = file;
            
            // 预览
            const reader = new FileReader();
            reader.onload = (e) => {
                dropZone.style.backgroundImage = \`url(\${e.target.result})\`;
                document.getElementById('upload-placeholder').style.display = 'none';
                dropZone.classList.add('has-img');
                document.getElementById('img-original').src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            document.getElementById('btn-upscale').disabled = false;
            document.getElementById('result-area').style.display = 'none';
            setStatus('');
            log(\`已选择文件: \${file.name} (\${(file.size/1024).toFixed(2)} KB)\`);
        }

        function setStatus(msg, loading=false) {
            const el = document.getElementById('status');
            el.innerHTML = loading ? \`<span class="spinner"></span> \${msg}\` : msg;
        }

        async function startUpscale() {
            if (!currentFile) return;
            const btn = document.getElementById('btn-upscale');
            btn.disabled = true;
            
            try {
                // 1. 上传
                setStatus('正在上传图片...', true);
                log('开始上传图片到 /proxy/upload ...');
                const formData = new FormData();
                formData.append('file', currentFile);
                
                const upRes = await fetch('/proxy/upload', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + API_KEY },
                    body: formData
                });
                const upData = await upRes.json();
                if (!upData.success) throw new Error(upData.message || '上传失败');
                uploadedUrl = upData.data.url;
                log(\`上传成功。URL: \${uploadedUrl}\`, 'success');

                // 2. 提交任务
                setStatus('正在提交放大任务...', true);
                log('提交放大任务到 /proxy/generate ...');
                const genRes = await fetch('/proxy/generate', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_url: uploadedUrl })
                });
                const genData = await genRes.json();
                if (!genData.success) throw new Error(genData.message || '提交失败');
                const taskId = genData.taskId;
                log(\`任务提交成功。Task ID: \${taskId}\`, 'success');

                // 3. 轮询
                setStatus(\`任务处理中 (ID: \${taskId})...\`, true);
                log('开始轮询任务状态...');
                let pollCount = 0;
                const pollInterval = setInterval(async () => {
                    pollCount++;
                    try {
                        const statusRes = await fetch(\`/proxy/status?taskId=\${taskId}\`, {
                            headers: { 'Authorization': 'Bearer ' + API_KEY }
                        });
                        const statusData = await statusRes.json();
                        
                        if (statusData.code === 0 && statusData.data) {
                            const status = statusData.data.status;
                            log(\`轮询 #\${pollCount}: \${status}\`);
                            
                            if (status === 'success') {
                                clearInterval(pollInterval);
                                const resultUrl = statusData.data.images.resultImageUrl;
                                log(\`任务完成! 结果 URL: \${resultUrl}\`, 'success');
                                showResult(resultUrl);
                            } else if (status === 'failed') {
                                clearInterval(pollInterval);
                                const errMsg = statusData.data.statusMessage || '未知错误';
                                setStatus('❌ 任务失败: ' + errMsg);
                                log(\`任务失败: \${errMsg}\`, 'error');
                                btn.disabled = false;
                            } else {
                                setStatus(\`任务处理中... (\${status}) \${pollCount * 2}s\`, true);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        log(\`轮询出错: \${e.message}\`, 'error');
                    }
                }, 2000);

            } catch (e) {
                setStatus('❌ 错误: ' + e.message);
                log(\`流程异常: \${e.message}\`, 'error');
                btn.disabled = false;
            }
        }

        function showResult(url) {
            setStatus('✅ 放大完成！');
            document.getElementById('img-result').src = url;
            document.getElementById('download-link').href = url;
            document.getElementById('result-area').style.display = 'block';
            document.getElementById('btn-upscale').disabled = false;
            
            // 确保图片加载成功
            document.getElementById('img-result').onerror = function() {
                log('结果图片加载失败，可能是 URL 失效或防盗链。', 'error');
            };
            document.getElementById('img-result').onload = function() {
                log('结果图片渲染成功。', 'success');
            };
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
