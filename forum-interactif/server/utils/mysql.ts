import mysql from 'mysql2/promise'
import bluebird from 'bluebird'
import type { EventHandler, EventHandlerRequest } from 'h3'

export const defineWrappedResponseHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>
): EventHandler<T, D> =>
  defineEventHandler<T>(async event => {
    try {
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DATABASE || 'forum',
        Promise: bluebird,
      })
      event.context.mysql = connection
      const response = await handler(event)
      await event.context.mysql.end()
      return response
    } catch (err) {
      // Error handling
      return { err }
    }
  })
