export default defineWrappedResponseHandler(async (event) => {
  const db = event.context.mysql
  const [rows] = await db.execute(`
    SELECT f.id, f.name, f.created_at,
           COUNT(t.id) AS topic_count
    FROM forums f
    LEFT JOIN topics t ON t.forum_id = f.id
    GROUP BY f.id
    ORDER BY f.created_at ASC
  `) as any[]

  return { forums: rows }
})
