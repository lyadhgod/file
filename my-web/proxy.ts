import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './utils';

const allowedOrigins = (process.env.FILE_MYWEB_ALLOWED_ORIGINS ?? '').split(',')
 
const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
}

export async function proxy(request: NextRequest) {  
    // Check the origin from the request
  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = allowedOrigins.includes(origin);
 
  // Handle preflighted requests 
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      ...corsOptions,
      ...(isAllowedOrigin ? { 'Access-Control-Allow-Origin': origin } : {}),
    }
    return NextResponse.json({}, { headers: preflightHeaders })
  }

  // Verify JWT for protected routes
  const pathname = request.nextUrl.pathname;
  let isPublicRoute = false;
  switch (pathname) {
    case '/api/ping':
    case '/api/verify-jwt':
      isPublicRoute = true;
      break;
  }
  
  if (!isPublicRoute) {
    const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return unauthorizedResponse;
    }
    
    const isValid = await verifyJwt(parts[1]);
    if (!isValid) {
      return unauthorizedResponse;
    }
  }
 
  // Handle simple requests
  const response = NextResponse.next()
 
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
 
  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
 
  return response;
}
