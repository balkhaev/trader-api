import Queue from "bull"

export const parseNewsQueue = new Queue("parse-news", {
  redis: {
    port: 6379,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
  },
})

parseNewsQueue.process(async (job) => {})
