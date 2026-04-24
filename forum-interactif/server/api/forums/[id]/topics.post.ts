export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Vous devez être connecté pour créer un sujet' })
  }

  const forumId = getRouterParam(event, 'id')
  const { title, message } = await readBody(event)

  if (!title || !title.trim()) {
    throw createError({ statusCode: 400, message: 'Le titre est requis' })
  }
  if (!message || !message.trim()) {
    throw createError({ statusCode: 400, message: 'Le message initial est requis' })
  }

  const db = event.context.mysql

  // Vérifie que le forum existe
  const [forums] = await db.execute(
    'SELECT id FROM forums WHERE id = ?',
    [forumId]
  ) as any[]
  if (forums.length === 0) {
    throw createError({ statusCode: 404, message: 'Forum introuvable' })
  }

  // Crée le sujet
  const [topicResult] = await db.execute(
    'INSERT INTO topics (forum_id, user_id, title) VALUES (?, ?, ?)',
    [forumId, session.user.id, title.trim()]
  ) as any[]
  const topicId = topicResult.insertId

  // Crée le premier message
  await db.execute(
    'INSERT INTO messages (topic_id, user_id, content) VALUES (?, ?, ?)',
    [topicId, session.user.id, message.trim()]
  )

  // Notifie tous les clients connectés
  broadcastWs({ type: 'new-topic', forumId: Number(forumId), topicId })

  return { id: topicId, title: title.trim() }
})
