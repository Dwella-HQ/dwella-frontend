// import "@/styles/tailwind.css";
// import "@/styles/globals.scss";
import "@/styles/globals.css";
import "react-day-picker/dist/style.css";

import type { NextPage } from "next";
import type { AppProps } from "next/app";
import * as React from "react";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ToastProvider } from "@/components/Toast";
import { UserProvider } from "@/contexts/UserContext";
import { SelectedLandlordProvider } from "@/contexts/SelectedLandlordContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ChatProvider } from "@/contexts/ChatContext";

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const DwellivaApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ToastProvider>
      <UserProvider>
        <NotificationsProvider>
          <SelectedLandlordProvider>
            <ChatProvider>
              {getLayout(<Component {...pageProps} />)}
              <ScrollToTopButton />
              <PWAInstallPrompt />
            </ChatProvider>
          </SelectedLandlordProvider>
        </NotificationsProvider>
      </UserProvider>
    </ToastProvider>
  );
};

export default DwellivaApp;
