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

	const firstProgress = Math.floor(Math.random() * 16) + 5;
	const secondProgress = Math.floor(Math.random() * 75) + 21;
	const progressTimers = [
		setTimeout(() => {
			onProgress?.(firstProgress / 100);
		}, 100),
		setTimeout(() => {
			onProgress?.(secondProgress / 100);
		}, 600),
		setTimeout(() => {
			onProgress?.(0.95);
		}, 1600),
	];

	try {
		const response = await fetch(`${API_BASE_URL}/api/file`, {
			method: 'POST',
			headers: typeof jwt === 'string' && jwt.length > 0 ? { Authorization: `Bearer ${jwt}` } : undefined,
			body: formData,
		});
		const payload = await response.text();

		progressTimers.forEach(clearTimeout);
		onProgress?.(1);

		if (!response.ok) {
			throw parseApiError(payload, `Upload failed with status ${response.status}.`);
		}

		try {
			return JSON.parse(payload) as FileRecord;
		} catch {
			throw new Error('The upload response could not be parsed.');
		}
	} catch (error) {
		progressTimers.forEach(clearTimeout);

		if (error instanceof Error) {
			throw error;
		}

		throw new Error('The upload request failed.');
	}
}
