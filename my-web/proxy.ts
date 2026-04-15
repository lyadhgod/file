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
    return new NextResponse(null, { status: 200, headers: preflightHeaders })
  }

  // Verify JWT for protected routes
  const pathname = request.nextUrl.pathname;
  let isPublicRoute = true;
  if (pathname.startsWith('/api')) {
    isPublicRoute = false;
    switch (pathname) {
      case '/api/ping':
        isPublicRoute = true;
        break;
    }
  }
  
  let jwtPayload;
  if (!isPublicRoute) {
    const unauthorizedResponse = new NextResponse(null, { status: 401 });
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return unauthorizedResponse;
    }
    
    const { valid, payload } = await verifyJwt(parts[1]);
    if (!valid) {
      return unauthorizedResponse;
    }
    jwtPayload = payload;
  }
 
  // Handle simple requests
  let response: NextResponse;
  if (typeof jwtPayload?.user?.id === 'string') {
    const url = request.nextUrl.clone();
    url.searchParams.set("user_id", jwtPayload.user.id);

    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
 
  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
 
  return response;
}
