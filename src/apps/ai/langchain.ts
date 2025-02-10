import { OpenAI } from "openai"
import { traceable } from "langsmith/traceable"
import { wrapOpenAI } from "langsmith/wrappers"

const client = wrapOpenAI(new OpenAI())

;(async () => {
  const pipeline = traceable(async (user_input) => {
    const result = await client.chat.completions.create({
      messages: [{ role: "user", content: user_input }],
      model: "gpt-3.5-turbo",
    })
    return result.choices[0].message.content
  })

  await pipeline("Hello, world!")
})()
