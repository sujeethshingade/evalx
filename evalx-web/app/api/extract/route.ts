export const config = {
  api: {
    bodyParser: {
      sizeLimit: '512mb',
    },
    responseLimit: false,
  },
}

export async function POST(req: Request) {
    // This file acts as a pass-through in development since rewrites happen at the routing layer
    // For Vercel, the vercel.json overrides this
    return new Response('Not Implemented directly via Next.js in production', { status: 501 })
}