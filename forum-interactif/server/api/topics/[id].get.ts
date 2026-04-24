export default defineWrappedResponseHandler(async (event) => {
  const topicId = getRouterParam(event, 'id')
  const db = event.context.mysql

  const [rows] = await db.execute(`
    SELECT t.id, t.title, t.locked, t.created_at,
           t.forum_id, f.name AS forum_name,
           u.username AS author
    FROM topics t
    JOIN forums f ON f.id = t.forum_id
    JOIN users u ON u.id = t.user_id
    WHERE t.id = ?
  `, [topicId]) as any[]

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Sujet introuvable' })
  }

  return { topic: rows[0] }
})
