import { Polar } from '@polar-sh/sdk'

// Set POLAR_SERVER=sandbox in Vercel while testing against Polar's sandbox
// environment; omit (or set to "production") once live.
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production',
})
