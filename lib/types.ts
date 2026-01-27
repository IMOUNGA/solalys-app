export type User = { id: string; email: string; name?: string }
export type LoginReq = { email: string; password: string }
export type LoginRes = { accessToken: string; refreshToken?: string }
export type SignupReq = { name?: string; email: string; password: string }
export type SignupRes = { message: string }
