import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Platform,
  Image,
  BackHandler,
  Share,
  Linking,
  Dimensions
} from "react-native";
import WebView from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import * as Localization from 'expo-localization';
import Signal from "../services/Signal";

const { height, width } = Dimensions.get('window');
const hebrewWebsite = "https://reganews.co.il";
const englishWebsite = "https://rega.news";
const script = `
    (function() {
      function addShareButtonListener() {
        document.querySelectorAll('.share-button').forEach(button => {
          // Ensure we don't attach the event more than once
          if (!button.hasAttribute('data-share-listener')) {
            button.setAttribute('data-share-listener', 'true');
            button.addEventListener('click', function(e) {
              e.preventDefault();
              const urlToShare = window.location.href; // Or any specific URL you want to share
              window.ReactNativeWebView.postMessage(urlToShare);
            });
          }
        });
      }

      // Initial application of the listener
      addShareButtonListener();

      // Use MutationObserver to monitor the DOM for changes and apply the listener to new buttons
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // Re-apply listener whenever new nodes are added to the DOM
            addShareButtonListener();
          }
        });
      });

      // Configuration of the observer:
      const config = { childList: true, subtree: true };

      // Pass in the target node, as well as the observer options
      observer.observe(document.body, config);
    })();
    true; // Ensures the injected script executes
  `;

export default function Index() {
  const [webViewSource, setWebViewSource] = useState(hebrewWebsite);
  const [showWebView, setShowWebview] = useState(false);
  const webviewRef: React.MutableRefObject<any> = useRef(null);

  // Inject JavaScript for share functionality
  const injectShareScript = () => webviewRef.current.injectJavaScript(script);

  // WebView redirection logic
  const redirect = useCallback((data: any) => {
    if (data.targetUrl) {
      setShowWebview(false);
      setTimeout(() => {
        setWebViewSource(data.targetUrl);
        setShowWebview(true);
      }, 500);
    }
  }, []);

  // Handle WebView messages
  const onMessage = (event: any) => {
    const url = event.nativeEvent.data;
    Share.share({ message: `Check this out: ${url}`, url });
  };

  // Handling back button press
  useEffect(() => {
    const backAction = () => {
      if (webviewRef.current) {
        webviewRef.current.goBack();
        return true; // Prevent default behavior (exiting the app)
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    Signal.Register(redirect);
    return () => {
      Signal.Close();
      backHandler.remove();
    };
  }, [redirect]);

  // בדיקת שפה והגדרת הכתובת
  useEffect(() => {
    const deviceLanguage = Localization.getLocales()[0].languageCode;
    if (deviceLanguage === 'he' || deviceLanguage === 'iw') {
      setWebViewSource(hebrewWebsite);
    } else {
      setWebViewSource(englishWebsite);
    }
    setShowWebview(true); // להראות את ה-WebView רק לאחר שהכתובת נקבעה
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#031048" barStyle="light-content" />
      {/* {!showWebView && (
        <View style={styles.bg}>
          <Image style={styles.gif} source={require("../assets/splash.gif")} />
        </View>
      )} */}
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
          onLoad={injectShareScript}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          setSupportMultipleWindows={false}
          style={{ width: "100%", height: "100%" }}
          renderLoading={() => (
            <View style={styles.bg}>
              <Image style={styles.gif} source={require("../assets/splash.gif")} />
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

const STATUSBAR_HEIGHT = StatusBar.currentHeight;
const APPBAR_HEIGHT = Platform.OS === "ios" ? 44 : 56;

const styles = StyleSheet.create({
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

