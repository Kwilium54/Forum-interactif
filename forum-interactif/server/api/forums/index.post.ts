export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const { name } = await readBody(event)
  if (!name || !name.trim()) {
    throw createError({ statusCode: 400, message: 'Nom du forum requis' })
  }

  const db = event.context.mysql
  const [result] = await db.execute(
    'INSERT INTO forums (name) VALUES (?)',
    [name.trim()]
  ) as any[]

  return { id: result.insertId, name: name.trim() }
})
