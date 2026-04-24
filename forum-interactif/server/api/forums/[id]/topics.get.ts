export default defineWrappedResponseHandler(async (event) => {
  const forumId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = 20
  const offset = (page - 1) * limit

  const db = event.context.mysql

  // Vérifie que le forum existe
  const [forums] = await db.execute(
    'SELECT id, name FROM forums WHERE id = ?',
    [forumId]
  ) as any[]
  if (forums.length === 0) {
    throw createError({ statusCode: 404, message: 'Forum introuvable' })
  }

  // Nombre total de sujets pour la pagination
  const [countRows] = await db.execute(
    'SELECT COUNT(*) AS total FROM topics WHERE forum_id = ?',
    [forumId]
  ) as any[]
  const total = countRows[0].total

  // Sujets avec auteur + infos dernier message
  const [rows] = await db.query(`
    SELECT
      t.id,
      t.title,
      t.created_at,
      t.last_message_at,
      t.locked,
      u.username AS author,
      (SELECT COUNT(*) FROM messages m WHERE m.topic_id = t.id) AS message_count,
      (SELECT u2.username FROM messages m2
         JOIN users u2 ON u2.id = m2.user_id
         WHERE m2.topic_id = t.id
         ORDER BY m2.created_at DESC LIMIT 1) AS last_message_author,
      (SELECT m3.created_at FROM messages m3
         WHERE m3.topic_id = t.id
         ORDER BY m3.created_at DESC LIMIT 1) AS last_message_date
    FROM topics t
    JOIN users u ON u.id = t.user_id
    WHERE t.forum_id = ?
    ORDER BY t.last_message_at DESC
    LIMIT ? OFFSET ?
  `, [Number(forumId), limit, offset]) as any[]

  return {
    forum: forums[0],
    topics: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  }
})
