import Redis from "ioredis"
const client = new Redis(process.env.REDIS_DATABASE_URL as string);
export default client;
