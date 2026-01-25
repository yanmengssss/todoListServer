import nodemailer from "nodemailer";
import { prisma } from "../DB/mysql";
const formEmail = process.env.EMAIL as string;
const pass = process.env.EMAIL_PASS as string;
export interface CreateTaskType {
    userID: string;
    title: string;
    description?: string;
    priority?: number;
    endAt?: Date;
    favorite?: boolean;
    needTips?: boolean;
    tags: Array<string>;
    createdAt: Date;
}

export interface TaskType extends CreateTaskType {
    id: string;
    status: string;
    tags: Array<string>;
    completedAt?: Date | string;
}
// 创建邮件发送器
const transporter = nodemailer.createTransport({
    service: "qq", // 邮箱服务商，例如 'qq', 'gmail', '163'
    auth: {
        user: formEmail,
        pass: pass, // 必须是授权码，而非邮箱密码
    },
    tls: {
        rejectUnauthorized: false, // 允许自签名证书,解决 "unable to verify the first certificate" 错误
    },
});

export async function sendMail(
    to: string,
    text: string
) {
    const info = await transporter.sendMail({
        from: `"Life Pilot" <${formEmail}>`,
        to: to,
        subject: "任务提醒",
        html: text,
    });
    return info;
}
export const defaultPriority = 3;
export const defaultTagColor = "#ffffff";
export const defaultStatus = "unknow";
export const statusList = {
    pending: {
        label: "进行中",
        color: "#ff4500",
        bg: "#fef3c7"
    },
    completed: {
        label: "已完成",
        color: "#00ff00",
        bg: "#dbeafe"
    },
    late: {
        label: "已延期",
        color: "#ff0000",
        bg: "#d1fae5"
    },
    timeout: {
        label: "已超时 ",
        color: "#ff0000",
        bg: "#f3f4f6"
    },
    unknow: {
        label: "未知",
        color: defaultTagColor,
        bg: defaultTagColor
    },
};
export const priorityList = [
    {
        val: 0,
        label: "P0",
        color: "#ff0000", // 红色，最高优先级
    },
    {
        val: 1,
        label: "P1",
        color: "#ff4500", // 橙红
    },
    {
        val: 2,
        label: "P2",
        color: "#ffa500", // 橙色
    },
    {
        val: 3,
        label: "P3",
        color: "#ffd700", // 金色
    },
    {
        val: 4,
        label: "P4",
        color: "#9acd32", // 黄绿色
    },
    {
        val: 5,
        label: "P5",
        color: "#00ff00", // 绿色，最低优先级
    },
];
const getTagsType = (IDList: Array<string>) => {
    return prisma.tags.findMany({
        where: {
            id: {
                in: IDList
            }
        }
    })
}
// 任务提醒邮件模板
export const MessageTemplate = async (task: TaskType) => {

    const statusInfo = statusList[task.status as keyof typeof statusList] || statusList.pending;
    const priorityInfo = priorityList[task.priority || 1] || priorityList[1];

    // 格式化时间
    const formatDate = (date?: Date | string) => {
        if (!date) return "未设置";
        const d = new Date(date);
        return d.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    const tagsType = await getTagsType(task.tags);

    // 生成标签 HTML
    const tagsHtml = tagsType?.length
        ? tagsType
            .map(
                (tag) =>
                    `<span style="display: inline-block; background: ${tag.color || '#e0e7ff'}; color: black; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-right: 6px; margin-bottom: 6px;">${tag.text}</span>`
            )
            .join("")
        : '<span style="color: black; font-size: 13px;">暂无标签</span>';
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa;">
  <div style="max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);">
    <!-- 头部 -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 30px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px; font-weight: 600;">📋 任务提醒</h1>
      <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 14px;">您有一个待办任务即将到期</p>
    </div>
    
    <!-- 任务标题 -->
    <div style="padding: 28px 30px 0 30px;">
      <h2 style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 600; line-height: 1.4;">${task.title}</h2>
    </div>

    <!-- 任务信息 -->
    <div style="padding: 24px 30px;">
      <!-- 状态和优先级 -->
      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <span style="display: inline-block; background: ${statusInfo.bg}; color: ${statusInfo.color}; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">${statusInfo.label}</span>
        <span style="display: inline-block; background: #fef2f2; color: ${priorityInfo.color}; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">${priorityInfo.label}</span>
      </div>

      <!-- 描述 -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">描述</p>
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">${task.description || "暂无描述"}</p>
      </div>

      <!-- 时间信息 -->
      <div style="display: grid; gap: 12px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #94a3b8; font-size: 13px;">📅 创建时间：</span>
          <span style="color: #334155; font-size: 13px; font-weight: 500;">${formatDate(task.createdAt)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #94a3b8; font-size: 13px;">⏰ 截止时间：</span>
          <span style="color: #ef4444; font-size: 13px; font-weight: 500;">${formatDate(task.endAt)}</span>
        </div>
      </div>

      <!-- 标签 -->
      <div>
        <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">标签</p>
        <div>${tagsHtml}</div>
      </div>
    </div>

    <!-- 底部 -->
    <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">请及时处理您的待办任务</p>
      <p style="margin: 0; color: #cbd5e1; font-size: 11px;">© ${new Date().getFullYear()} Life Pilot. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};