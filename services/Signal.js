import { OneSignal, LogLevel } from "react-native-onesignal";
import Constants from "expo-constants";
import * as Localization from "expo-localization";

// הגדרת רמת הלוגים של OneSignal
OneSignal.Debug.setLogLevel(6);

// אתחול OneSignal עם מזהה האפליקציה
OneSignal.initialize(Constants.expoConfig.extra.oneSignalAppId);

// הגדרת שפת המכשיר והוספת תגית
let deviceLanguage = Localization.getLocales()[0].languageCode;
if (deviceLanguage === "iw") deviceLanguage = "he";
OneSignal.User.addTag("language", deviceLanguage);

const Close = () => {
  OneSignal.Notifications.removeEventListener("click");
};

// פונקציה לרישום מאזינים לאירועים של OneSignal
const Register = (callback) => {
  // בקשת הרשאות להתראות
  OneSignal.Notifications.requestPermission(true);

  // מאזין לאירועי לחיצה על הודעות
  OneSignal.Notifications.addEventListener("click", (event) => {
    const data = event.notification.additionalData;
    callback(data);
  });
};

if (__DEV__) OneSignal.User.addTag("tester", "yes");

export default { Register, Close };
