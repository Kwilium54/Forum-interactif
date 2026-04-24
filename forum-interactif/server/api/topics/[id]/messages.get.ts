export default defineWrappedResponseHandler(async (event) => {
  const topicId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = 20
  const offset = (page - 1) * limit

  const db = event.context.mysql

  // Vérifie que le sujet existe
  const [topics] = await db.execute(
    'SELECT id, title, locked FROM topics WHERE id = ?',
    [topicId]
  ) as any[]
  if (topics.length === 0) {
    throw createError({ statusCode: 404, message: 'Sujet introuvable' })
  }

  // Nombre total de messages
  const [countRows] = await db.execute(
    'SELECT COUNT(*) AS total FROM messages WHERE topic_id = ?',
    [topicId]
  ) as any[]
  const total = countRows[0].total

  // Messages avec auteur
  const [rows] = await db.query(`
    SELECT m.id, m.content, m.created_at, m.updated_at,
           u.id AS user_id, u.username
    FROM messages m
    JOIN users u ON u.id = m.user_id
    WHERE m.topic_id = ?
    ORDER BY m.created_at ASC
    LIMIT ? OFFSET ?
  `, [Number(topicId), limit, offset]) as any[]

  return {
    messages: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  }
})
