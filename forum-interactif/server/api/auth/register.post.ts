import bcrypt from 'bcryptjs'

export default defineWrappedResponseHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Champs manquants' })
  }
  if (username.length < 3 || username.length > 50) {
    throw createError({ statusCode: 400, message: 'Nom d\'utilisateur invalide (3-50 caractères)' })
  }
  if (password.length < 4) {
    throw createError({ statusCode: 400, message: 'Mot de passe trop court (minimum 4 caractères)' })
  }

  const db = event.context.mysql

  const [existing] = await db.execute(
    'SELECT id FROM users WHERE username = ?',
    [username]
  ) as any[]

  if (existing.length > 0) {
    throw createError({ statusCode: 409, message: 'Ce nom d\'utilisateur est déjà pris' })
  }

  const hash = await bcrypt.hash(password, 12)
  const [result] = await db.execute(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hash, 'user']
  ) as any[]

  await setUserSession(event, {
    user: {
      id: result.insertId,
      username,
      role: 'user',
    }
  })

  return { success: true }
})
