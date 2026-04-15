import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../integrations/prisma';
import { save } from '../../../integrations/s3';
import { buildFilePayload, getPrivateUploadUserId, getUploadFile, getVisibilityValue } from './file-service';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const { error: fileError, file } = getUploadFile(formData);
        if (fileError !== null || file === null) {
            return NextResponse.json({ errors: fileError }, { status: 400 });
        }

        const { error: visibilityError, visibility } = getVisibilityValue(formData);
        if (visibilityError !== null || visibility === null) {
            return NextResponse.json({ errors: visibilityError }, { status: 400 });
        }

        const { error: userIdError, userId } = getPrivateUploadUserId(request, visibility);
        if (userIdError !== null) {
            return NextResponse.json({ errors: userIdError }, { status: 403 });
        }

        const { buffer, mime, name, sha256, sha512 } = await buildFilePayload(file);
        const record = await prisma.file.create({
            data: {
                mime,
                name,
                sha256,
                sha512,
                userId,
                visibility,
            },
        });

        try {
            await save(record.id, buffer);
        } catch (error) {
            await prisma.file.delete({
                where: {
                    id: record.id,
                },
            });
            throw error;
        }

        return NextResponse.json(record, { status: 201 });
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}

