import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    CreateBucketCommand,
    HeadObjectCommand
} from "@aws-sdk/client-s3";

const client = new S3Client({
    region: process.env.FILE_MYWEB_S3_REGION,
    credentials: {
        accessKeyId: process.env.FILE_MYWEB_S3_ACCESS_KEY,
        secretAccessKey: process.env.FILE_MYWEB_S3_SECRET_KEY,
    },
    endpoint: process.env.FILE_MYWEB_S3_URL,
});

async function createBucketIfDev() {
    if (process.env.NODE_ENV !== 'development') return;

    try {
        const command = new CreateBucketCommand({
            Bucket: process.env.FILE_MYWEB_S3_BUCKET_NAME,
        });
        await client.send(command);
    } catch {
    }
}

export async function save(name: string, buffer: Buffer) {
    await createBucketIfDev();

    const command = new PutObjectCommand({
        Bucket: process.env.FILE_MYWEB_S3_BUCKET_NAME,
        Key: name,
        Body: buffer,
    });
    await client.send(command);
}

export async function get(name: string) {
    await createBucketIfDev();

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.FILE_MYWEB_S3_BUCKET_NAME,
            Key: name,
        });
        const result = await client.send(command);
        if (!result.Body) {
            return null;
        }

        const stream = result.Body.transformToWebStream();
        return stream;
    } catch (error) {
        if (error?.name === 'NoSuchKey') {
            return null;
        }
        throw error;
    }
}

export async function remove(name: string) {
    await createBucketIfDev();

    try {
        const command = new HeadObjectCommand({
            Bucket: process.env.FILE_MYWEB_S3_BUCKET_NAME,
            Key: name,
        });
        await client.send(command);
    } catch (error) {
        if (error?.name === 'NotFound') {
            return false;
        }
    }
    
    const command = new DeleteObjectCommand({
        Bucket: process.env.FILE_MYWEB_S3_BUCKET_NAME,
        Key: name,
    });
    await client.send(command);

    return true;
}
