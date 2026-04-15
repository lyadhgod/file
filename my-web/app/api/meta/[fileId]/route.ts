import { NextRequest, NextResponse } from 'next/server';
import { canAccessFile, findFileRecord } from '../../file/file-service';

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

        return NextResponse.json(record);
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}