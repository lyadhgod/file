import { UiProvider } from '../git-submodules/components/my-app/lib/ui-provider';
import '../global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import FileUploader from '../lib/uploader';
import { Box } from '../git-submodules/components/my-ui/lib/box';
import FileProvider from '../lib/file-provider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [styleLoaded, setStyleLoaded] = useState(false);
  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <>
      { Platform.OS === 'web' && (
          <Head>
            <title>{process.env.EXPO_PUBLIC_FILE_MYAPP_BASE_NAME}</title>
          </Head>
      ) }
      <UiProvider>
        <FileProvider>
          <Box className='flex-1 p-4'>
            <FileUploader acceptedMimeTypes={['*/*']}/>
          </Box>
        </FileProvider>
      </UiProvider>
    </>
  );
}