import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../../../integrations/prisma';

const allowedVisibilityValues = ['public', 'private'] as const;

export type FileVisibilityValue = (typeof allowedVisibilityValues)[number];

export function getUploadFile(formData: FormData) {
    const fileEntry = formData.get('file');

    if (!(fileEntry instanceof File)) {
        return {
            error: 'The request must include FormData with a file field.',
            file: null,
        };
    }

    return {
        error: null,
        file: fileEntry,
    };
}

export function getVisibilityValue(formData: FormData) {
    const visibilityEntry = formData.get('visibility');

    if (visibilityEntry === null) {
        return {
            error: null,
            visibility: 'public' as const,
        };
    }

    if (typeof visibilityEntry !== 'string' || !allowedVisibilityValues.includes(visibilityEntry as FileVisibilityValue)) {
        return {
            error: 'The visibility field must be either public or private.',
            visibility: null,
        };
    }

    return {
        error: null,
        visibility: visibilityEntry as FileVisibilityValue,
    };
}

export async function buildFilePayload(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
        buffer,
        mime: file.type,
        name: file.name,
        sha256: createHash('sha256').update(buffer).digest('hex'),
        sha512: createHash('sha512').update(buffer).digest('hex'),
    };
}

export async function findFileRecord(fileId: string) {
    return prisma.file.findUnique({
        where: {
            id: fileId,
        },
    });
}

export async function canAccessFile(_: NextRequest, visibility: FileVisibilityValue) {
    if (visibility === 'public') {
        return true;
    }

    return true;
}

export function buildDownloadHeaders(name: string, mime: string) {
    const safeFileName = name.replace(/\"/g, '');

    return {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    };
}