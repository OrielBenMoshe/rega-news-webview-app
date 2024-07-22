import { OneSignal, LogLevel } from "react-native-onesignal";
import Constants from "expo-constants";
import * as Localization from "expo-localization";

OneSignal.Debug.setLogLevel(6);
OneSignal.initialize(Constants.expoConfig.extra.oneSignalAppId);

let deviceLanguage = Localization.getLocales()[0].languageCode;
if (deviceLanguage === "iw") deviceLanguage = "he";

// console.log("Device language:", deviceLanguage);

OneSignal.User.addTag("language", deviceLanguage);

const Close = () => {
  OneSignal.Notifications.removeEventListener("click");
};

// Function to register OneSignal event listeners
const Register = (callback) => {
  // Request permission to receive push notifications
  OneSignal.Notifications.requestPermission(true);

  // Add event listener for notification click events
  OneSignal.Notifications.addEventListener("click", (event) => {
    const data = event.notification.additionalData;
    callback(data);
  });
};

if (__DEV__) OneSignal.User.addTag("tester", "yes");

export default { Register, Close };
