const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ''
const CLOUDFLARE_D1_TOKEN = process.env.CLOUDFLARE_D1_TOKEN || ''
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || ''

interface D1Response {
  success: boolean
  result: any[]
  errors: any[]
}

export async function queryD1(sql: string, params: any[] = []): Promise<any[]> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_D1_TOKEN || !CLOUDFLARE_D1_DATABASE_ID) {
    console.warn('Cloudflare D1 credentials not configured')
    return []
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_D1_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params,
        }),
      }
    )

    const data: D1Response = await response.json()
    
    if (!data.success) {
      throw new Error(`D1 query failed: ${JSON.stringify(data.errors)}`)
    }

    return data.result
  } catch (error) {
    console.error('D1 query error:', error)
    throw error
  }
}

// Helper to check if D1 is configured
export function isD1Configured(): boolean {
  return !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_TOKEN && CLOUDFLARE_D1_DATABASE_ID)
}

