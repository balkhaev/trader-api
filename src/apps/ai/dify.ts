import { dify } from "../../lib/dify"

export async function getDifyProgross() {
  const { data } = await dify.post("/v1/workflows/run", {
    inputs: {},
    response_mode: "blocking",
    user: "balkhaev",
  })

  console.log(data)

  return data
}
