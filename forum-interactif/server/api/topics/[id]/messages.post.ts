export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Vous devez être connecté' })
  }

  const topicId = getRouterParam(event, 'id')
  const { content } = await readBody(event)

  if (!content || !content.trim()) {
    throw createError({ statusCode: 400, message: 'Le message est requis' })
  }

  const db = event.context.mysql

  // Vérifie que le sujet existe et n'est pas verrouillé
  const [topics] = await db.execute(
    'SELECT id, locked FROM topics WHERE id = ?',
    [topicId]
  ) as any[]
  if (topics.length === 0) {
    throw createError({ statusCode: 404, message: 'Sujet introuvable' })
  }
  if (topics[0].locked) {
    throw createError({ statusCode: 403, message: 'Ce sujet est verrouillé' })
  }

  const [result] = await db.execute(
    'INSERT INTO messages (topic_id, user_id, content) VALUES (?, ?, ?)',
    [topicId, session.user.id, content.trim()]
  ) as any[]

  // Met à jour last_message_at du sujet
  await db.execute(
    'UPDATE topics SET last_message_at = NOW() WHERE id = ?',
    [topicId]
  )

  // Notifie tous les clients connectés
  broadcastWs({ type: 'new-message', topicId: Number(topicId) })

  return { id: result.insertId }
})
