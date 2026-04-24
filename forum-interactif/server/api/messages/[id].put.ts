export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Vous devez être connecté' })
  }

  const messageId = getRouterParam(event, 'id')
  const { content } = await readBody(event)

  if (!content || !content.trim()) {
    throw createError({ statusCode: 400, message: 'Le message est requis' })
  }

  const db = event.context.mysql
  const [rows] = await db.execute(
    'SELECT id, user_id FROM messages WHERE id = ?',
    [messageId]
  ) as any[]

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Message introuvable' })
  }

  // Seul l'auteur ou un admin peut modifier
  if (rows[0].user_id !== session.user.id && session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  await db.execute(
    'UPDATE messages SET content = ? WHERE id = ?',
    [content.trim(), messageId]
  )

  return { success: true }
})
