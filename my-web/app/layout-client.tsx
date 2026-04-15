'use client';

import { UiProvider } from "../git-submodules/components/my-ui/lib/ui-provider";
import { useSearchParams } from "next/navigation";
import StyledJsxRegistry from "./registry";
import { Dictionary } from "../dictionary";
import { VStack } from "../git-submodules/components/my-ui/lib/vstack/index.web";
import { View } from "../git-submodules/components/my-ui/lib/view/index";

export default function LayoutClient({
  children,
  dict,
}: Readonly<{
  children: React.ReactNode;
  dict: Dictionary;
}>) {
    const searchParams = useSearchParams();
    const theme = searchParams.get('theme');

    return (
      <StyledJsxRegistry>
        <UiProvider mode={(theme === 'light' || theme === 'dark') ? theme : undefined}>
          <VStack className="w-full">
            <View className="flex flex-1">
              {children}
            </View>
          </VStack>
        </UiProvider>
      </StyledJsxRegistry>
    );
}
