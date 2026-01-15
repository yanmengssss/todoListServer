import express from "express";
import { baseURL, generateRequestData } from "../utils/coze";
import { PassThrough } from "stream";
const router = express.Router();
const stream = new PassThrough();
router.post("/chat", async (req, res) => {
  const { user_id, context } = req.body;

  if (!user_id || !context) {
    return res.status(400).send("Missing user_id or context.");
  }

  const requestData = generateRequestData(user_id, context);

  // 设置 SSE 响应头，支持实时流式输出
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Pragma", "no-cache");
  res.flushHeaders?.(); // 🟢 强制立即发送头部，确保前端立即开始接收

  try {
    const url = `${baseURL}/v3/chat`;

    // ✅ Node.js 18+ 自带 fetch，可直接使用
    const apiResponse = await fetch(url, {
      ...requestData,
      cache: "no-store", // 🚫 禁止缓存（标准 Fetch API 语义）
      headers: {
        ...requestData.headers,
        "Cache-Control": "no-cache, no-store, must-revalidate", // 禁止代理缓存
        Pragma: "no-cache", // 兼容 HTTP/1.0
        Expires: "0", // 禁止代理缓存
      },
    });

    if (!apiResponse.ok || !apiResponse.body) {
      res.status(500).send("API request failed");
      return;
    }

    // ✅ Node.js 原生 fetch 返回的 body 是 WHATWG ReadableStream
    // 可以直接使用 getReader()
    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let i = 0;
    // 逐步读取数据块并实时转发给前端
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      console.log(chunk, i);
      i++;
      // 如果 Coze 返回的是 SSE 格式，可以直接写出
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error.");
  }
});

export default router;
