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
	onProgress?: (progress: number) => void;
	jwt?: string | null;
};

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

function buildNativeFormFile(asset: UploadableFileAsset) {
	return {
		uri: asset.uri,
		name: asset.name,
		type: asset.mimeType,
	} as unknown as Blob;
}

export async function uploadFile({
	asset,
	visibility = 'public',
	onProgress,
	jwt,
}: UploadFileParams) {
	const formData = new FormData();

	if (Platform.OS === 'web') {
		if (!(typeof File !== 'undefined' && asset.file instanceof File)) {
			throw new Error('A browser File instance is required when uploading from the web.');
		}

		formData.append('file', asset.file);
	} else {
		formData.append('file', buildNativeFormFile(asset));
	}

	formData.append('visibility', visibility);

	return new Promise<FileRecord>((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.open('POST', `${API_BASE_URL}/api/file`);
		if (typeof jwt === 'string' && jwt.length > 0) {
			xhr.setRequestHeader('Authorization', `Bearer ${jwt}`);
		}
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
