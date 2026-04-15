import { jwtVerify, createLocalJWKSet, JSONWebKeySet } from 'jose';
import { get, set } from './integrations/redis';

export async function verifyJwt(token: string) {
  try {
    let jwks = await get('file_jwks');
    if (jwks === null) {
      const res = await fetch(`${process.env.FILE_MYWEB_AUTH_API_BASE_URL}${process.env.FILE_MYWEB_AUTH_BETTERAUTH_API_BASE_PATH}/jwks`);
      jwks = await res.json() as JSONWebKeySet;
      await set('file_jwks', jwks);
    }

    const JWKS = createLocalJWKSet(jwks)
    const result = await jwtVerify(token, JWKS, {
      issuer: process.env.FILE_MYWEB_AUTH_API_BASE_URL, // Should match your JWT issuer, which is the BASE_URL
    })

    return {
      valid: true,
      payload: result.payload,
    };
  } catch (error) {
    return {
      valid: false,
      payload: null,
    };
  }
}
