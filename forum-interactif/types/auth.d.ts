declare module '#auth-utils' {
  interface User {
    id: number
    username: string
    role: 'user' | 'admin'
  }

  interface UserSession {
    user: User
  }
}

export {}
