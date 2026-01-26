import redis from "../DB/redis";
import { MessageTemplate, sendMail, TaskType } from "../utils/email";
import { prisma } from "../DB/mysql";
export const getUser = (userID: string) => {//user的tipsTime和tipsFrequency单位都是h
    return prisma.user.findUnique({
        where: { userID }
    })
}
export const getTask = (id: string) => {
    return prisma.task.findUnique({
        where: { id }
    })
}
const SCHEDULER_KEY = "scheduler:tasks";

/**
 * 核心调度函数
 * 建议在 Express 启动时调用一次 startScheduler()
 */
export async function startScheduler() {
    console.log("⏰ 定时任务调度器已启动...");
    // 无限循环
    while (true) {
        try {
            const now = Date.now();
            // 1. 【拉取】获取当前时间之前（即该触发）的任务
            // range: 0 到 now, 限制一次取 10 个防止阻塞
            const taskIds = await redis.zrangebyscore(SCHEDULER_KEY, 0, now, "LIMIT", 0, 10);
            console.log(taskIds, "本次需要执行的");
            if (taskIds.length > 0) {
                // 并行处理这一批任务
                await Promise.all(taskIds.map((id) => processTask(id)));
            } else {
                // 如果没有任务，休息 1 秒，避免 CPU 空转
                await sleep(3000);
            }
        } catch (error) {
            console.error("❌ 调度器发生错误:", error);
            // 防止死循环报错导致 CPU 飙升，出错也休息一下
            await sleep(3000);
        }
    }
}

/**
 * 单个任务的处理逻辑
 */
async function processTask(taskId: string) {
    try {
        // 2. 【抢占】为了防止下一秒的轮询再次扫到这个任务，
        // 我们先把它从 Redis 里移除。如果处理失败（抛错），你可以选择是否加回去。
        // ZREM 返回 1 表示移除成功（你是第一个拿到它的），返回 0 表示被别的线程抢了
        const removedCount = await redis.zrem(SCHEDULER_KEY, taskId);

        if (removedCount === 0) {
            return; // 被其他进程抢走了，跳过
        }

        // 3. 【查库】去数据库获取任务详情
        const task = await getTask(taskId);

        // 如果数据库里任务没了（用户删了），就什么都不做，Redis 里也已经删了，流程结束
        if (!task) {
            console.log(`任务 ${taskId} 在数据库不存在，跳过`);
            return;
        }
        const user = await getUser(task.userID);
        const now = Date.now();
        const endTime = task.endAt ? new Date(task.endAt).getTime() : Infinity;
        if (!user) {
            console.log(`用户 ${task.userID} 在数据库不存在，跳过`);
            return;
        }
        if (task.status === "completed") {
            return
        }
        // 4. 【判断：是否已过期/截至】
        if (endTime <= now) {
            // --- 情况 A: 任务已截至 ---
            // 超时
            await prisma.task.update({
                where: { id: taskId },
                data: { status: 'timeout' },
            });
            sendMail(user.email, await MessageTemplate({ ...task, status: "timeout" } as TaskType));
        } else {
            // --- 情况 B: 任务进行中，需要提醒 ---
            console.log(`📧 任务 ${taskId} 触发提醒，发送邮件...`);
            // 发送邮件逻辑
            sendMail(user.email, await MessageTemplate(task as TaskType));

            // 5. 【计算下一次时间并写回】
            const frequencyMs = (user.tipsFrequency || 1) * 60 * 1000 * 60;
            const nextTriggerTime = now + frequencyMs;

            // 如果下一次提醒时间 还在 截至时间之前，就放回 Redis
            if (nextTriggerTime < endTime) {
                await redis.zadd(SCHEDULER_KEY, nextTriggerTime, taskId);
                console.log(`🔄 任务 ${taskId} 已重新调度至 ${new Date(nextTriggerTime).toLocaleString()}`);
            } else {
                // 如果下一次提醒已经超过截至时间了，通常就不再提醒了，
                await redis.zadd(SCHEDULER_KEY, endTime, taskId);
                console.log(`🛑 任务 ${taskId} 下次提醒将超时`);
            }
        }

    } catch (error) {
        console.error(`处理任务 ${taskId} 失败:`, error);
        // 选做：如果你希望容错，可以在这里把 taskId 重新 ZADD 回去，或者记录到死信队列
        //重新加到ZADD
        await redis.zadd(SCHEDULER_KEY, Date.now(), taskId);
    }
}

// 辅助函数：睡眠
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

