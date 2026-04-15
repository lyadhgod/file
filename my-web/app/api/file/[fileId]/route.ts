import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../integrations/prisma';
import { get, remove } from '../../../../integrations/s3';
import { buildDownloadHeaders, canAccessFile, findFileRecord } from '../file-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    try {
        const { fileId } = await params;
        const record = await findFileRecord(fileId);
        if (record === null) {
            return new NextResponse(null, { status: 404 });
        }

        const hasAccess = canAccessFile(request, record);
        if (!hasAccess) {
            return new NextResponse(null, { status: 403 });
        }

        const stream = await get(fileId);
        if (stream === null) {
            return new NextResponse(null, { status: 404 });
        }

        return new NextResponse(stream, {
            headers: buildDownloadHeaders(record.name, record.mime),
        });
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    try {
        const { fileId } = await params;
        const record = await findFileRecord(fileId);
        if (record === null) {
            return new NextResponse(null, { status: 404 });
        }

        const hasAccess = canAccessFile(request, record);
        if (!hasAccess) {
            return new NextResponse(null, { status: 403 });
        }

        await remove(fileId);
        await prisma.file.delete({
            where: {
                id: fileId,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}
