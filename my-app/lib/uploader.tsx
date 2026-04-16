import { useEffect, useReducer, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
	CloudUpload,
	File as FileIcon,
	FileImage,
	FileText,
	FileVideo,
	Music4,
	X,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { useDictionaryText } from '../contexts/DictionaryContext';
import { type FileRecord, type FileVisibility, uploadFile } from '../api-client';
import { Box } from '../git-submodules/components/my-ui/lib/box';
import { Button, ButtonIcon, ButtonText } from '../git-submodules/components/my-ui/lib/button';
import { Image } from '../git-submodules/components/my-ui/lib/image';
import { Pressable } from '../git-submodules/components/my-ui/lib/pressable';
import { Progress, ProgressFilledTrack } from '../git-submodules/components/my-ui/lib/progress';
import { Text } from '../git-submodules/components/my-ui/lib/text';
import { useFileContext } from './file-provider';

type PreviewKind = 'image' | 'video' | 'pdf' | 'audio' | 'file';

type SelectedFile = {
	id: string;
	uri: string;
	name: string;
	mimeType: string;
	previewKind: PreviewKind;
	previewUri: string | null;
	file?: File | null;
	shouldRevokePreview: boolean;
};

type ErrorKey = '7' | '8' | '9' | '10' | null;

type State = {
	selectedFile: SelectedFile | null;
	errorKey: ErrorKey;
	isUploading: boolean;
	progress: number;
};

type Action =
	| { type: 'SELECT_FILE'; payload: SelectedFile }
	| { type: 'RESET' }
	| { type: 'SET_ERROR'; payload: ErrorKey }
	| { type: 'PREVIEW_ERROR' }
	| { type: 'UPLOAD_START' }
	| { type: 'UPLOAD_PROGRESS'; payload: number }
	| { type: 'UPLOAD_SUCCESS' }
	| { type: 'UPLOAD_ERROR' };

type UploaderStrings = {
	clickPrompt: string;
	upload: string;
	uploading: string;
	remove: string;
	selectedFile: string;
	unsupportedType: string;
	previewUnavailable: string;
	selectionError: string;
	uploadError: string;
};

export type FileUploaderProps = {
	acceptedMimeTypes?: string[];
	onUploadComplete?: (file: FileRecord) => void;
	onUploadError?: (error: Error) => void;
	visibility?: FileVisibility;
};

const defaultAcceptedMimeTypes = ['*/*'];

const initialState: State = {
	selectedFile: null,
	errorKey: null,
	isUploading: false,
	progress: 0,
};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'SELECT_FILE':
			return {
				...state,
				selectedFile: action.payload,
				errorKey: null,
				progress: 0,
			};
		case 'RESET':
			return initialState;
		case 'SET_ERROR':
			return {
				...state,
				errorKey: action.payload,
			};
		case 'PREVIEW_ERROR':
			if (!state.selectedFile) {
				return state;
			}

			return {
				...state,
				errorKey: '8',
				selectedFile: {
					...state.selectedFile,
					previewUri: null,
					shouldRevokePreview: false,
				},
			};
		case 'UPLOAD_START':
			return {
				...state,
				errorKey: null,
				isUploading: true,
				progress: 0,
			};
		case 'UPLOAD_PROGRESS':
			return {
				...state,
				progress: action.payload,
			};
		case 'UPLOAD_SUCCESS':
			return {
				...state,
				isUploading: false,
				progress: 1,
			};
		case 'UPLOAD_ERROR':
			return {
				...state,
				errorKey: '10',
				isUploading: false,
			};
		default:
			return state;
	}
}

function normalizeMimeType(mimeType: string | undefined, fileName: string) {
	if (mimeType && mimeType.length > 0) {
		return mimeType;
	}

	const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

	switch (extension) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'gif':
			return 'image/gif';
		case 'webp':
			return 'image/webp';
		case 'mp4':
			return 'video/mp4';
		case 'mov':
			return 'video/quicktime';
		case 'mp3':
			return 'audio/mpeg';
		case 'wav':
			return 'audio/wav';
		case 'pdf':
			return 'application/pdf';
		default:
			return 'application/octet-stream';
	}
}

function matchesAcceptedMimeType(mimeType: string, acceptedMimeTypes: string[]) {
	if (acceptedMimeTypes.length === 0) {
		return true;
	}

	return acceptedMimeTypes.some((acceptedMimeType) => {
		if (acceptedMimeType === '*/*') {
			return true;
		}

		if (acceptedMimeType.endsWith('/*')) {
			const [acceptedMajor] = acceptedMimeType.split('/');
			const [candidateMajor] = mimeType.split('/');
			return acceptedMajor === candidateMajor;
		}

		return acceptedMimeType === mimeType;
	});
}

function getPreviewKind(mimeType: string): PreviewKind {
	if (mimeType.startsWith('image/')) {
		return 'image';
	}

	if (mimeType.startsWith('video/')) {
		return 'video';
	}

	if (mimeType === 'application/pdf') {
		return 'pdf';
	}

	if (mimeType.startsWith('audio/')) {
		return 'audio';
	}

	return 'file';
}

function buildSelectedFile(asset: DocumentPicker.DocumentPickerAsset) {
	const mimeType = normalizeMimeType(asset.mimeType, asset.name);
	const previewKind = getPreviewKind(mimeType);
	const webFile = Platform.OS === 'web' ? asset.file ?? null : null;
	const previewUri =
		Platform.OS === 'web' && webFile && previewKind !== 'audio' && previewKind !== 'file'
			? URL.createObjectURL(webFile)
			: previewKind === 'image'
				? asset.uri
				: null;

	return {
		id: `${asset.name}-${webFile?.lastModified ?? asset.uri}`,
		file: webFile,
		mimeType,
		name: asset.name,
		previewKind,
		previewUri,
		shouldRevokePreview: Platform.OS === 'web' && previewUri !== null && webFile !== null,
		uri: asset.uri,
	} satisfies SelectedFile;
}

function FallbackIcon({ previewKind }: { previewKind: PreviewKind }) {
	switch (previewKind) {
		case 'audio':
			return Music4;
		case 'image':
			return FileImage;
		case 'video':
			return FileVideo;
		case 'pdf':
			return FileText;
		default:
			return FileIcon;
	}
}

function renderProgressBar(progress: number) {
	return (
		<Box className="absolute bottom-4 left-4 right-4">
			<Progress size="sm" value={Math.max(progress * 100, 8)}>
				<ProgressFilledTrack />
			</Progress>
		</Box>
	);
}

type PreviewContentProps = {
	selectedFile: SelectedFile | null;
	strings: UploaderStrings;
	onPreviewError: () => void;
};

function PreviewContent({ selectedFile, strings, onPreviewError }: PreviewContentProps) {
	if (!selectedFile) {
		return (
			<Box className="flex-1 items-center justify-center px-6 py-8">
				<Box className="mb-4 rounded-xl border border-dashed border-slate-300 p-4">
					<CloudUpload size={42} strokeWidth={1.75} />
				</Box>
				<Text className="text-center text-base font-semibold">{strings.clickPrompt}</Text>
			</Box>
		);
	}

	if (selectedFile.previewKind === 'image' && selectedFile.previewUri) {
		return (
			<>
				<Image
					className="h-full w-full"
					resizeMode="cover"
					size="full"
					source={{ uri: selectedFile.previewUri }}
					onError={onPreviewError}
				/>
				<Box className="absolute bottom-0 left-0 right-0 bg-black/40 px-4 py-3">
					<Text className="text-sm text-white">{selectedFile.name}</Text>
				</Box>
			</>
		);
	}

	let FallbackIcon = FileIcon;
	switch (selectedFile.previewKind) {
		case 'audio':
			FallbackIcon = Music4; break;
		case 'image':
			FallbackIcon = FileImage; break;
		case 'video':
			FallbackIcon = FileVideo; break;
		case 'pdf':
			FallbackIcon = FileText; break;
		default:
			FallbackIcon = FileIcon;
	} 

	return (
		<Box className="flex-1 items-center justify-center px-6 py-8">
			<Box className="mb-4 rounded-xl border border-slate-300 p-4">
				<FallbackIcon size={40} strokeWidth={1.75} />
			</Box>
			<Text className="text-center text-base font-semibold">{selectedFile.name}</Text>
			<Text className="mt-1 text-center text-sm">{strings.selectedFile}</Text>
		</Box>
	);
}

type PreviewSectionProps = {
	selectedFile: SelectedFile | null;
	strings: UploaderStrings;
	isUploading: boolean;
	progress: number;
	onSelect: () => void;
	onReset: () => void;
	onPreviewError: () => void;
};

function PreviewSection({
	selectedFile,
	strings,
	isUploading,
	progress,
	onSelect,
	onReset,
	onPreviewError,
}: PreviewSectionProps) {
	return (
		<Pressable
			accessibilityLabel={strings.clickPrompt}
			className="relative h-72 w-full overflow-hidden rounded-t-xl border border-slate-300 border-b-0"
			disabled={isUploading}
			onPress={onSelect}
		>
			<Box className="flex-1">
				<PreviewContent
					onPreviewError={onPreviewError}
					selectedFile={selectedFile}
					strings={strings}
				/>
			</Box>
			{selectedFile && !isUploading ? (
				<Button
					accessibilityLabel={strings.remove}
					className="absolute right-3 top-3 z-10 rounded-full p-3.5 shadow"
					onPress={onReset}
					size="lg"
					variant='solid'
					action='secondary'
				>
					<ButtonIcon as={X} />
				</Button>
			) : null}
			{isUploading ? renderProgressBar(progress) : null}
		</Pressable>
	);
}

export function FileUploader({
	acceptedMimeTypes = defaultAcceptedMimeTypes,
	onUploadComplete,
	onUploadError,
	visibility = 'public',
}: FileUploaderProps) {
	const [state, dispatch] = useReducer(reducer, initialState);
	const objectUrlRef = useRef<string | null>(null);
	const t = useDictionaryText();
	const { jwt } = useFileContext();

	const strings: UploaderStrings = {
		clickPrompt: t('2'),
		upload: t('3'),
		uploading: t('4'),
		remove: t('5'),
		selectedFile: t('6'),
		unsupportedType: t('7'),
		previewUnavailable: t('8'),
		selectionError: t('9'),
		uploadError: t('10'),
	};

	useEffect(() => {
		if (Platform.OS !== 'web') {
			return;
		}

		const nextObjectUrl = state.selectedFile?.shouldRevokePreview ? state.selectedFile.previewUri : null;

		if (objectUrlRef.current && objectUrlRef.current !== nextObjectUrl) {
			URL.revokeObjectURL(objectUrlRef.current);
		}

		objectUrlRef.current = nextObjectUrl ?? null;

		return () => {
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = null;
			}
		};
	}, [state.selectedFile]);

	function resetSelection() {
		dispatch({ type: 'RESET' });
	}

	function handlePreviewError() {
		dispatch({ type: 'PREVIEW_ERROR' });
	}

	const errorMessage =
		state.errorKey === '7'
			? strings.unsupportedType
			: state.errorKey === '9'
				? strings.selectionError
				: state.errorKey === '10'
					? strings.uploadError
					: '';

	async function selectFile() {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				base64: false,
				copyToCacheDirectory: Platform.OS !== 'web',
				multiple: false,
				type: acceptedMimeTypes.length > 0 ? acceptedMimeTypes : '*/*',
			});

			if (result.canceled || result.assets.length === 0) {
				return;
			}

			const nextSelectedFile = buildSelectedFile(result.assets[0]);
			if (!matchesAcceptedMimeType(nextSelectedFile.mimeType, acceptedMimeTypes)) {
				dispatch({ type: 'SET_ERROR', payload: '7' });
				return;
			}

			dispatch({ type: 'SELECT_FILE', payload: nextSelectedFile });
		} catch {
			dispatch({ type: 'SET_ERROR', payload: '9' });
		}
	}

	async function handleUpload() {
		if (!state.selectedFile || state.isUploading) {
			return;
		}

		dispatch({ type: 'UPLOAD_START' });

		try {
			const record = await uploadFile({
				asset: {
					file: state.selectedFile.file,
					mimeType: state.selectedFile.mimeType,
					name: state.selectedFile.name,
					uri: state.selectedFile.uri,
				},
				onProgress: (progress) => {
					dispatch({ type: 'UPLOAD_PROGRESS', payload: progress });
				},
				visibility,
				jwt,
			});

			dispatch({ type: 'UPLOAD_SUCCESS' });
			onUploadComplete?.(record);
		} catch (error) {
			dispatch({ type: 'UPLOAD_ERROR' });
			onUploadError?.(error instanceof Error ? error : new Error(strings.uploadError));
		}
	}

	return (
		<Box className="flex-1">
			<PreviewSection
				isUploading={state.isUploading}
				onPreviewError={handlePreviewError}
				onReset={resetSelection}
				onSelect={selectFile}
				progress={state.progress}
				selectedFile={state.selectedFile}
				strings={strings}
			/>
			<Button
				accessibilityLabel={state.isUploading ? strings.uploading : strings.upload}
				isDisabled={!state.selectedFile || state.isUploading}
				onPress={handleUpload}
				className='rounded-none rounded-b-xl border border-slate-300 border-t-0 '
			>
				<ButtonText>
					{state.isUploading ? strings.uploading : strings.upload}
				</ButtonText>
			</Button>
			{errorMessage ? <Text className="text-sm text-error-600 my-2">{errorMessage}</Text> : null}
		</Box>
	);
}

export default FileUploader;
