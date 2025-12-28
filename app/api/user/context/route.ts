import { apiSuccess, apiError } from '@/lib/api-utils'
import { getCurrentUserContext, getUserPermissions } from '@/lib/auth-permissions'

/**
 * GET /api/user/context
 * Get current user's context, role, and permissions
 */
export async function GET() {
  try {
    const userContext = await getCurrentUserContext()
    
    if (!userContext) {
      return apiError('Unauthorized', 401)
    }

    const permissions = await getUserPermissions(userContext)

    return apiSuccess({
      userContext,
      permissions
    })
  } catch (error) {
    console.error('User context error:', error)
    return apiError('Internal server error', 500)
  }
}
