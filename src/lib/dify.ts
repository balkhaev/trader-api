import axios from "axios"

export const dify = axios.create({
  baseURL: "http://localhost",
  headers: {
    Authorization: `Bearer ${process.env.DIFY_TOKEN!}`,
  },
})
