import mysql from 'mysql2/promise'
import bluebird from 'bluebird'
import bcrypt from 'bcryptjs'

async function createConnectionWithRetry(options: mysql.ConnectionOptions, maxRetries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mysql.createConnection(options)
      return conn
    } catch (err: any) {
      if (attempt === maxRetries) throw err
      console.log(`[init-db] MySQL non disponible (tentative ${attempt}/${maxRetries}), nouvelle tentative dans ${delayMs / 1000}s...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('[init-db] Impossible de se connecter à MySQL après plusieurs tentatives')
}

export default defineNitroPlugin(async () => {
  console.log('[init-db] Initialisation de la base de données...')

  let connection
  try {
    // Connexion initiale avec retry
    connection = await createConnectionWithRetry({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      Promise: bluebird,
    })

    const db = process.env.MYSQL_DATABASE || 'forum'
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.end()

    // Reconnexion avec la database sélectionnée
    connection = await createConnectionWithRetry({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: db,
      Promise: bluebird,
    })

    // Création des tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username    VARCHAR(50)  NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        role        ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        avatar      VARCHAR(255) DEFAULT NULL,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS forums (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(150) NOT NULL,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS topics (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        forum_id      INT UNSIGNED NOT NULL,
        user_id       INT UNSIGNED NOT NULL,
        title         VARCHAR(255) NOT NULL,
        locked        TINYINT(1) NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (forum_id) REFERENCES forums(id)  ON DELETE CASCADE,
        FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        topic_id    INT UNSIGNED NOT NULL,
        user_id     INT UNSIGNED NOT NULL,
        content     TEXT NOT NULL,
        quote_id    INT UNSIGNED DEFAULT NULL,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id)  REFERENCES topics(id)   ON DELETE CASCADE,
        FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
        FOREIGN KEY (quote_id)  REFERENCES messages(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // Compte admin par défaut
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    ) as any[]

    if (rows.length === 0) {
      const hash = await bcrypt.hash('admin', 12)
      await connection.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hash, 'admin']
      )
      console.log('[init-db] Compte admin créé (admin / admin)')
    }

    console.log('[init-db] Base de données prête.')
  } catch (err) {
    console.error('[init-db] Erreur lors de l\'initialisation :', err)
  } finally {
    if (connection) await connection.end()
  }
})
