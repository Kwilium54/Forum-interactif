import bcrypt from 'bcryptjs'

export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }

  const { currentPassword, newPassword } = await readBody(event)

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Champs manquants' })
  }
  if (newPassword.length < 4) {
    throw createError({ statusCode: 400, message: 'Nouveau mot de passe trop court (minimum 4 caractères)' })
  }

  const db = event.context.mysql
  const [rows] = await db.execute(
    'SELECT password FROM users WHERE id = ?',
    [session.user.id]
  ) as any[]

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Utilisateur introuvable' })
  }

  const valid = await bcrypt.compare(currentPassword, rows[0].password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Mot de passe actuel incorrect' })
  }

  const hash = await bcrypt.hash(newPassword, 12)
  await db.execute(
    'UPDATE users SET password = ? WHERE id = ?',
    [hash, session.user.id]
  )

  return { success: true }
})
