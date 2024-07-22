import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Image,
  BackHandler,
  Share,
  Dimensions,
  ToastAndroid,
  AppState
} from "react-native";
import WebView, { WebViewNavigation } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from 'expo-status-bar';
import * as Localization from 'expo-localization';
import * as Linking from 'expo-linking';
import Signal from "../services/Signal";

const { height, width } = Dimensions.get('window');
const hebrewWebsite = "https://reganews.co.il/";
const englishWebsite = "https://rega.news/";
const script = `
    (function() {
      function addShareButtonListener() {
        document.querySelectorAll('.share-button').forEach(button => {
          if (!button.hasAttribute('data-share-listener')) {
            button.setAttribute('data-share-listener', 'true');
            button.addEventListener('click', function(e) {
              e.preventDefault();
              const urlToShare = window.location.href;
              window.ReactNativeWebView.postMessage(urlToShare);
            });
          }
        });
      }

      addShareButtonListener();

      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            addShareButtonListener();
          }
        });
      });

      const config = { childList: true, subtree: true };

      observer.observe(document.body, config);
    })();
    true;
  `;

let globalUrl: string | null = null;

export default function Index() {
  const [webViewSource, setWebViewSource] = useState<string>(hebrewWebsite);
  const [deviceLanguage, setDeviceLanguage] = useState<string>();
  const [showWebView, setShowWebview] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>(hebrewWebsite);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const webviewRef = useRef<WebView>(null);
  const lastBackPress = useRef<number>(0);

  const injectShareScript = () => webviewRef.current?.injectJavaScript(script);

  const saveCurrentUrl = (url: string) => {
    globalUrl = url;
  };

  const loadCurrentUrl = () => {
    if (globalUrl) {
      setWebViewSource(globalUrl);
      setCurrentUrl(globalUrl);
    }
  };

  const redirect = useCallback((data: { targetUrl?: string }) => {
    if (data.targetUrl && webviewRef.current) {
      setWebViewSource(data.targetUrl);
      setCurrentUrl(data.targetUrl);
      saveCurrentUrl(data.targetUrl);
    }
  }, []);

  const handleDeepLink = useCallback((event: { url: string }) => {
    const { url } = event;
    const parsedUrl = Linking.parse(url);
    const targetUrl = parsedUrl.queryParams?.targetUrl;

    if (typeof targetUrl === 'string' && webviewRef.current) {
      setWebViewSource(targetUrl);
      setCurrentUrl(targetUrl);
      saveCurrentUrl(targetUrl);
    }
  }, []);

  const onMessage = (event: any) => {
    const url = event.nativeEvent.data;
    Share.share({ message: `Check this out: ${url}`, url });
  };

  useEffect(() => {
    const backAction = () => {
      const now = Date.now();
      if (webviewRef.current) {
        if (canGoBack) {
          webviewRef.current.goBack();
          return true;
        } else if (currentUrl !== hebrewWebsite && currentUrl !== englishWebsite) {
          setWebViewSource(deviceLanguage === 'he' || deviceLanguage === 'iw' ? hebrewWebsite : englishWebsite);
          setShowWebview(false);
          setTimeout(() => {
            setShowWebview(true);
          }, 100);
          return true;
        } else if (now - lastBackPress.current < 2000) {
          BackHandler.exitApp();
        } else {
          lastBackPress.current = now;
          ToastAndroid.show(
            deviceLanguage === 'he' || deviceLanguage === 'iw' ? 'לחץ שוב כדי לצאת' : 'Press again to exit',
            ToastAndroid.SHORT
          );
          return true;
        }
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    Signal.Register(redirect);
    const subscription = Linking.addEventListener('url', handleDeepLink);

    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadCurrentUrl();
      }
    });

    return () => {
      Signal.Close();
      backHandler.remove();
      subscription.remove();
    };
  }, [redirect, currentUrl, deviceLanguage, canGoBack, handleDeepLink]);

  useEffect(() => {
    const lang = Localization.getLocales()[0].languageCode as string;
    setDeviceLanguage(lang);
  }, []);

  useEffect(() => {
    if (deviceLanguage) {
      setWebViewSource(deviceLanguage === 'he' || deviceLanguage === 'iw' ? hebrewWebsite : englishWebsite);
      setShowWebview(true);
    }
  }, [deviceLanguage]);

  useEffect(() => {
    if (webviewRef.current) {
      injectShareScript();
    }
  }, [showWebView, currentUrl]);

  return (
    <View style={stylesLOPLLO.container}>
      <StatusBar style="light" />
      {showWebView && (
        <WebView
          ref={webviewRef}
          source={{ uri: webViewSource }}
          automaticallyAdjustContentInsets={true}
          startInLoadingState={true}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={onMessage}
          onLoadStart={(event) => {
            setCurrentUrl(event.nativeEvent.url);
            saveCurrentUrl(event.nativeEvent.url);
          }}
          onLoadEnd={injectShareScript}
          onNavigationStateChange={(navState: WebViewNavigation) => {
            setCurrentUrl(navState.url);
            setCanGoBack(navState.canGoBack);
            saveCurrentUrl(navState.url);
          }}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          setSupportMultipleWindows={false}
          style={{ width: "100%", height: "100%" }}
          renderLoading={() => (
            <View style={stylesLOPLLO.bg}>
              <Image style={stylesLOPLLO.gif} source={require("../assets/splash.gif")} />
            </View>
          )}
          onShouldStartLoadWithRequest={({ url }) => {
            if (url.startsWith(hebrewWebsite) || url.startsWith(englishWebsite)) return true;
            WebBrowser.openBrowserAsync(url);
            return false;
          }}
          onFileDownload={({ nativeEvent: { downloadUrl } }) => {
            if (downloadUrl) Linking.openURL(downloadUrl);
          }}
        />
      )}
    </View>
  );
}

const stylesLOPLLO = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#031048",
  },
  bg: {
    width,
    height,
    backgroundColor: "#031048",
    margin: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  gif: {
    width,
    height,
    margin: "auto",
    resizeMode: 'contain'
  },
});
