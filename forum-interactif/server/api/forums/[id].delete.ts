export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const id = getRouterParam(event, 'id')
  const db = event.context.mysql
  const [result] = await db.execute(
    'DELETE FROM forums WHERE id = ?',
    [id]
  ) as any[]

  if (result.affectedRows === 0) {
    throw createError({ statusCode: 404, message: 'Forum introuvable' })
  }

  return { success: true }
})
