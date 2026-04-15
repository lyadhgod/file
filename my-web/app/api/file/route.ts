import { NextRequest, NextResponse } from 'next/server';
import { save } from '../../../integrations/s3';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        const arrayBuffer = await file.arrayBuffer();
        await save(file.name, arrayBuffer);

        return new NextResponse(null, { status: 201 });
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}

