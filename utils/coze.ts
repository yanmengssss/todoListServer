import { Response } from "express";
export const baseURL = "https://api.coze.cn";
const bot_id = "7570256696950784063";
const token =
  "sat_yHJbLg08o0l61gRp1bniFlyW1LEf2ZmzSHQBqiouk5MlO2NKjyJFUnHqwe0LYfaT";
export const generateRequestData = (user_id: string, context: string) => {
  const data = JSON.stringify({
    bot_id: bot_id,
    user_id: user_id,
    stream: true, // 设置为流式请求
    additional_messages: [
      {
        content: context,
        content_type: "text",
        role: "user",
        type: "question",
      },
    ],
    parameters: {},
    auto_save_history: true,
    enable_card: true,
    custom_variables: {
      time: "",
    },
  });

  return {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: data,
  };
};
