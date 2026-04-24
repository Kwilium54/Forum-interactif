export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const id = getRouterParam(event, 'id')
  const { name } = await readBody(event)
  if (!name || !name.trim()) {
    throw createError({ statusCode: 400, message: 'Nom du forum requis' })
  }

  const db = event.context.mysql
  const [result] = await db.execute(
    'UPDATE forums SET name = ? WHERE id = ?',
    [name.trim(), id]
  ) as any[]

  if (result.affectedRows === 0) {
    throw createError({ statusCode: 404, message: 'Forum introuvable' })
  }

  return { success: true }
})
