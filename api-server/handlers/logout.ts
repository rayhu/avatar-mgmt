import { Request, Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../middleware/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL;

export default async function logoutHandler(req: AuthenticatedRequest, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // If user is authenticated and has a Directus token, logout from Directus too
    if (req.user?.directus_token && DIRECTUS_URL) {
      try {
        await axios.post(`${DIRECTUS_URL}/auth/logout`, {
          refresh_token: req.body.refresh_token // Frontend should provide this
        }, {
          headers: {
            Authorization: `Bearer ${req.user.directus_token}`
          }
        });
      } catch (error) {
        console.warn('Failed to logout from Directus:', error);
        // Continue with logout even if Directus logout fails
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during logout'
    });
  }
}