export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const messageId = getRouterParam(event, 'id')
  const db = event.context.mysql

  const [result] = await db.execute(
    'DELETE FROM messages WHERE id = ?',
    [messageId]
  ) as any[]

  if (result.affectedRows === 0) {
    throw createError({ statusCode: 404, message: 'Message introuvable' })
  }

  return { success: true }
})
