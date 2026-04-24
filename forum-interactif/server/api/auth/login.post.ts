import bcrypt from 'bcryptjs'

export default defineWrappedResponseHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Champs manquants' })
  }

  const db = event.context.mysql
  const [rows] = await db.execute(
    'SELECT id, username, password, role FROM users WHERE username = ?',
    [username]
  ) as any[]

  if (rows.length === 0) {
    throw createError({ statusCode: 401, message: 'Identifiants incorrects' })
  }

  const user = rows[0]
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Identifiants incorrects' })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    }
  })

  return { success: true, user: { id: user.id, username: user.username, role: user.role } }
})
