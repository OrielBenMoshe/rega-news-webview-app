import { OneSignal, LogLevel } from "react-native-onesignal";
import Constants from "expo-constants";
import * as Localization from "expo-localization";

OneSignal.Debug.setLogLevel(LogLevel.Verbose);
OneSignal.initialize(Constants.expoConfig.extra.oneSignalAppId);

let deviceLanguage = Localization.getLocales()[0].languageCode;
if (deviceLanguage === "iw") deviceLanguage = "he";

// console.log("Device language:", deviceLanguage);

OneSignal.User.addTag("language", deviceLanguage);

const Close = () => {
  OneSignal.Notifications.removeEventListener("click");
};

const Register = (callback) => {
  OneSignal.Notifications.requestPermission(true);
  OneSignal.Notifications.addEventListener("click", (event) => {
    const data = event.notification.additionalData;
    callback(data);
  });
};

if (__DEV__) OneSignal.User.addTag("tester", "yes");

export default { Register, Close };
