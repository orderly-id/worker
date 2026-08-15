import { defineWorker, WorkerError } from '../../../../sdk/index.js'

async function relay(payload, ctx) {
  const endpoint = ctx.config.get('endpoint'); const secret = await ctx.secrets.get('secret')
  if (!endpoint || !secret) throw new WorkerError('CONFIG_REQUIRED', 'Endpoint dan secret wajib dikonfigurasi')
  const response = await ctx.network.fetch(endpoint, { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${secret}` }, body:JSON.stringify(payload) })
  if (!response.ok) throw new WorkerError('UPSTREAM_FAILED', `Webhook gagal (${response.status})`)
  return { delivered:true, status:response.status }
}
export default defineWorker({ async onMessage(event,ctx){ const result=await relay({type:'chat.message',text:event.text},ctx); await ctx.chat.reply('Webhook terkirim.'); return result }, actions:{ send:(input,ctx)=>relay({type:'worker.action',data:input},ctx) } })
