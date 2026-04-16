import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_FILE_MYAPP_API_BASE_URL?.replace(/\/+$/, '');

export type FileVisibility = 'public' | 'private';

export type FileRecord = {
	id: string;
	mime: string;
	name: string;
	sha256: string;
	sha512: string;
	userId: string | null;
	visibility: FileVisibility;
	createdAt: string;
	updatedAt: string;
};

export type UploadableFileAsset = {
	uri: string;
	name: string;
	mimeType: string;
	file?: File | null;
};

export type UploadFileParams = {
	asset: UploadableFileAsset;
	visibility?: FileVisibility;
	userId?: string;
	onProgress?: (progress: number) => void;
};

function getApiBaseUrl() {
	if (!API_BASE_URL) {
		throw new Error('EXPO_PUBLIC_FILE_MYAPP_API_BASE_URL is not configured.');
	}

	return API_BASE_URL;
}

function buildApiUrl(path: string, userId?: string) {
	const url = new URL(`${getApiBaseUrl()}${path}`);

	if (userId) {
		url.searchParams.set('user_id', userId);
	}

	return url.toString();
}

function parseApiError(payload: string | null, fallbackMessage: string) {
	if (!payload) {
		return new Error(fallbackMessage);
	}

	try {
		const parsed = JSON.parse(payload) as { errors?: string };
		if (typeof parsed.errors === 'string' && parsed.errors.length > 0) {
			return new Error(parsed.errors);
		}
	} catch {
		return new Error(payload);
	}

	return new Error(fallbackMessage);
}

async function parseJsonResponse<T>(response: Response) {
	if (!response.ok) {
		const payload = await response.text();
		throw parseApiError(payload, `Request failed with status ${response.status}.`);
	}

	return (await response.json()) as T;
}

function isWebFile(value: unknown): value is File {
	return typeof File !== 'undefined' && value instanceof File;
}

function buildNativeFormFile(asset: UploadableFileAsset) {
	return {
		uri: asset.uri,
		name: asset.name,
		type: asset.mimeType,
	} as unknown as Blob;
}

export function getFileDownloadUrl(fileId: string, userId?: string) {
	return buildApiUrl(`/api/file/${encodeURIComponent(fileId)}`, userId);
}

export async function pingApi() {
	const response = await fetch(buildApiUrl('/api/ping'));
	return parseJsonResponse<Record<string, unknown>>(response);
}

export async function getFileMeta(fileId: string, userId?: string) {
	const response = await fetch(buildApiUrl(`/api/meta/${encodeURIComponent(fileId)}`, userId));
	return parseJsonResponse<FileRecord>(response);
}

export async function deleteFile(fileId: string, userId?: string) {
	const response = await fetch(buildApiUrl(`/api/file/${encodeURIComponent(fileId)}`, userId), {
		method: 'DELETE',
	});

	if (!response.ok) {
		const payload = await response.text();
		throw parseApiError(payload, `Delete failed with status ${response.status}.`);
	}
}

export async function uploadFile({
	asset,
	visibility = 'public',
	userId,
	onProgress,
}: UploadFileParams) {
	const formData = new FormData();

	if (Platform.OS === 'web') {
		if (!isWebFile(asset.file)) {
			throw new Error('A browser File instance is required when uploading from the web.');
		}

		formData.append('file', asset.file);
	} else {
		formData.append('file', buildNativeFormFile(asset));
	}

	formData.append('visibility', visibility);

	return new Promise<FileRecord>((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.open('POST', buildApiUrl('/api/file', userId));
		xhr.responseType = 'text';

		xhr.upload.onprogress = (event) => {
			if (!event.lengthComputable) {
				return;
			}

			onProgress?.(event.loaded / event.total);
		};

		xhr.onerror = () => {
			reject(new Error('The upload request failed.'));
		};

		xhr.onabort = () => {
			reject(new Error('The upload request was aborted.'));
		};

		xhr.onload = () => {
			if (xhr.status < 200 || xhr.status >= 300) {
				reject(parseApiError(xhr.responseText, `Upload failed with status ${xhr.status}.`));
				return;
			}

			try {
				resolve(JSON.parse(xhr.responseText) as FileRecord);
			} catch {
				reject(new Error('The upload response could not be parsed.'));
			}
		};

		xhr.send(formData);
	});
}
