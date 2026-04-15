import { JSONWebKeySet } from "jose";
import { createClient } from "redis";

const client = createClient({
  url: process.env.FILE_MYWEB_REDIS_URL,
});

export type Key = 'file_jwks';

export async function get(key: Key) {
    if (!client.isOpen) {
        await client.connect();
    }

    const value = await client.get(key) as string | null;
    if (value === null) return null;

    const parsed = JSON.parse(value);

    switch (key) {
        case 'file_jwks':
            return parsed as JSONWebKeySet;
        default:
            throw new Error(`Unknown key: ${key}`);
    }
}

export async function set<T extends Key>(key: T, value: T extends 'file_jwks' ? JSONWebKeySet : never) {
    if (!client.isOpen) {
        await client.connect();
    }

    const stringified = JSON.stringify(value);

    await client.set(key, stringified);
}

export async function del(key: Key) {
    if (!client.isOpen) {
        await client.connect();
    }

    await client.del(key);
}
