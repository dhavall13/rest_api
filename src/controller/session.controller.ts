import { Request, Response } from 'express'
import config from 'config'
import { validatePassword } from '../service/user.service'
import { signJwt } from '../utils/jwt.utils'
import { createSession, findSessions } from '../service/session.service'

// Request<Params, ResBody, ReqBody>

export async function createUserSessionHandler(req: Request, res: Response) {
  // Validate the users password

  const user = await validatePassword(req.body)

  if (!user) {
    return res.status(401).send('Invalid email or password')
  }

  // Create a session

  const session = await createSession(user._id, req.get('user-agent') || '')

  // Create an access token

  const accessToken = signJwt(
    {
      ...user,
      session: session._id,
    },
    { expiresIn: config.get('accessTokenTtl') }
  )

  // Create a refresh token
  const refreshToken = signJwt(
    {
      ...user,
      session: session._id,
    },
    { expiresIn: config.get('refreshTokenTtl') }
  )

  // Return access and refresh tokens

  return res.send({ accessToken, refreshToken })
}

export async function getUserSessionHandler(req: Request, res: Response) {
  const userId = res.locals.user._id
  const sessions = await findSessions({ user: userId, valid: true })

  return res.send(sessions)
}
