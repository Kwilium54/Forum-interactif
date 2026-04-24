import bcrypt from 'bcryptjs'

export default defineWrappedResponseHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const { username, password } = await readBody(event)
  if (!username || !username.trim() || !password) {
    throw createError({ statusCode: 400, message: 'Champs manquants' })
  }

  const db = event.context.mysql
  const [existing] = await db.execute(
    'SELECT id FROM users WHERE username = ?',
    [username.trim()]
  ) as any[]

  if (existing.length > 0) {
    throw createError({ statusCode: 409, message: 'Ce nom d\'utilisateur est déjà pris' })
  }

  const hash = await bcrypt.hash(password, 12)
  await db.execute(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username.trim(), hash, 'admin']
  )

  return { success: true }
})
