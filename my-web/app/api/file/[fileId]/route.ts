import { NextRequest, NextResponse } from 'next/server';
import { get, remove } from '../../../../integrations/s3';

export async function GET(_: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    try {
        const { fileId } = await params;
        const stream = await get(fileId);
        if (stream === null) {
            return new NextResponse(null, { status: 404 });
        }

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Content-Disposition': `attachment; filename="${fileId}"`,
            },
        });
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    try {
        const { fileId } = await params;
        const success = await remove(fileId);
        return new NextResponse(null, { status: success ? 204 : 404 });
    } catch (error) {
        return new NextResponse(null, { status: 500 });
    }
}
