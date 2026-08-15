import { defineWorker } from '../../../sdk/index.js'

export default defineWorker({
  async onMessage(event, ctx) {
    await ctx.chat.reply(`Received: ${event.text}`)
  },
})
