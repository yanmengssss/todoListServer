import express from "express";
import qiniu from "qiniu";

const accessKey = process.env.QN_AK;
const secretKey = process.env.QN_SK;
const bucket = process.env.QN_bucketName;
// 1️⃣ 使用 AK / SK 创建鉴权对象（用于生成上传凭证）
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

// 2️⃣ 定义上传策略（决定这个 code 能干什么）
const options = {
    // scope 指定允许上传到哪个 bucket
    scope: bucket,

    // token 有效期，单位秒（建议 5～10 分钟）
    expires: 600,

    // 上传成功后七牛返回给前端的内容
    returnBody: JSON.stringify({
        key: '$(key)',     // 文件在七牛中的 key
        hash: '$(etag)',   // 文件 hash
    }),
};

// 3️⃣ 创建路由实例
const router = express.Router();

/**
 * @route   GET /code
 * @desc    获取七牛上传凭证（uploadToken / code）
 */
router.get("/code", (req, res) => {
    try {
        // 4️⃣ 使用上传策略生成 PutPolicy 实例
        const putPolicy = new qiniu.rs.PutPolicy(options);

        // 5️⃣ 生成 uploadToken（也就是你说的 code）
        const uploadToken = putPolicy.uploadToken(mac);

        // 6️⃣ 返回给前端
        res.json({
            code: uploadToken,
        });
    } catch (err) {
        // 7️⃣ 异常处理
        console.error("generate qiniu upload token error:", err);
        res.status(500).json({
            message: "Failed to generate upload token",
        });
    }
});

export default router;
