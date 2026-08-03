import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import {getFocusedRouteNameFromRoute} from '@react-navigation/core';
import codes from 'country-calling-code';
import {callingCountries} from 'country-data';
import {getDistance} from 'geolib';
import {Alert, Animated, BackHandler, Platform, Vibration} from 'react-native';
import DeviceCountry from 'react-native-device-country';
import {showMessage} from 'react-native-flash-message';
import Geocoder from 'react-native-geocoder';
import Geolocation from 'react-native-geolocation-service';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {selectContactPhone} from 'react-native-select-contact';
import staticStrings from '../constants/staticStrings';
import * as NavigationService from '../navigation/NavigationService';
import navigationStrings from '../navigation/navigationStrings';
import actions from '../redux/actions';
import {moderateScaleVertical} from '../styles/responsiveSize';
import strings from './../constants/lang/index';
import {apiGet} from './utils';

const getCurrentLocation = type =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const cords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        getLocation(
          position.coords.latitude,
          position.coords.longitude,
          type,
        ).then(res => {
          if (type == 'home') {
            const data = {
              ...cords,
              address: res,
            };
            resolve(data);
          } else if (type == 'address') {
            resolve(res);
          } else {
            const data = {
              ...cords,
              address: res,
            };
            resolve(data);
          }
        });
      },
      error => {
        // alert(error.message)
        reject(error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  });

const getLocation = async (lat, lng, type) => {
  if (type == 'home') {
    try {
      let res = await Geocoder.geocodePosition({lat, lng});
      let addr = res[0].formattedAddress;
      return addr;
    } catch (err) {}
  } else if (type == 'address') {
    try {
      let res = await Geocoder.geocodePosition({lat, lng});

      let addr = res[0].formattedAddress;

      let country_id =
        callingCountries[`${res[0].countryCode}`]?.countryCallingCodes[0];
      let street = res[0].streetName;
      let city = res[0].locality;
      let states = res[0].adminArea;
      let pincode = res[0].postalCode;
      let latitude = res[0].position.lat;
      let longitude = res[0].position.lng;

      let data = {
        address: addr,
        street: street,
        city: city,
        states: states,
        latitude: latitude,
        longitude: longitude,
        country_id: country_id,
        pincode: pincode,
        address_type: '1',
      };

      return data;
    } catch (err) {}
  } else {
    return await Geocoder.geocodePosition({lat, lng});
  }
};

const showError = message => {
  console.log(message, 'THIS IS MESSAGE');
  showMessage({
    type: 'danger',
    icon: 'danger',
    floating: true,
    animated: true,
    message,
    style: {
      marginTop: Platform.OS === 'android' ? moderateScaleVertical(50) : 0,
    },
  });
  // Toast.show(message);
};

const showSuccess = message => {
  showMessage({
    type: 'success',
    icon: 'success',
    floating: true,
    animated: true,
    style: {
      marginTop: Platform.OS === 'android' ? moderateScaleVertical(50) : 0,
    },
    message,
  });

  // Toast.show(message);
};
const showInfo = message => {
  showMessage({
    type: 'info',
    icon: 'info',
    message,
    style: {
      marginTop: Platform.OS === 'android' ? moderateScaleVertical(50) : 0,
    },
  });
  // Toast.show(message);
};

export function otpTimerCounter(seconds) {
  // alert(seconds)
  let m = Math.floor(seconds / 60);
  let s = seconds % 60;
  m = m < 10 ? '0' + m : m;
  s = s < 10 ? '0' + s : s;
  // return `${m}:${s}`;
  return `${s}`;
}

export function getRandomColor(opacity = 0.3) {
  const w = Math.floor(Math.random() * 256);
  const x = Math.floor(Math.random() * 256);
  const y = Math.floor(Math.random() * 256);
  const z = opacity;
  const rgbaColor = 'rgba(' + w + ',' + x + ',' + y + ',' + z + ')';
  return rgbaColor;
}

export function getColorCodeWithOpactiyNumber(color, transparency) {
  /*
HEXA VALUE CHANGE IS DIFFRENT IN JS, HERE THE TRANSPERANCY YOU WANT TO ADD IS ADDED AT THE END
Using an alpha value to update a color’s transparency will change the hex code format from #RRGGBB to #RRGGBBAA (red, green, blue, alpha).
The first six values (the red, green, and blue ones) stay the exact same. The only difference is the last two values (the AA).
  */
  switch (String(transparency)) {
    case '10':
      return `#${color}1A`;
    case '15':
      return `#${color}26`;
    case '20':
      return `#${color}33`;
    case '25':
      return `#${color}40`;
    case '30':
      return `#${color}4D`;
    case '35':
      return `#${color}59`;
    case '40':
      return `#${color}66`;
    case '50':
      return `#${color}80`;
    case '60':
      return `#${color}99`;
    case '70':
      return `#${color}B3`;
    case '80':
      return `#${color}B4`;
    case '90':
      return `#${color}B5`;
  }
}

export function getImageUrl(url1, url2, dimentions) {
  //
  return `${url1}${dimentions}${url2}`;
}

const androidBackButtonHandler = () => {
  Alert.alert(strings.HOLD_ON, strings.EXIT_WARNING, [
    {
      text: strings.CANCEL,
      onPress: () => null,
      style: 'cancel',
    },
    {text: strings.YES, onPress: () => BackHandler.exitApp()},
  ]);
  return true;
};

//Renaming the object key
const renameKey = (object, key, newKey) => {
  const clonedObj = clone(object);
  const targetKey = clonedObj[key];
  delete clonedObj[key];
  clonedObj[newKey] = targetKey;
  return clonedObj;
};
//cloning object
const clone = obj => Object.assign({}, obj);

export function getAddressComponent(details, update) {
  console.log(details, 'details');
  let pincode = '';
  let city = '';
  let states = '';
  let country = '';
  let country_id = '';
  let address = '';
  let latitude = '';
  let longitude = '';
  let street = '';
  pincode = details?.address_components?.find(addressComponent =>
    addressComponent?.types.includes('postal_code'),
  )?.short_name;

  city = details?.address_components?.find(addressComponent =>
    addressComponent?.types.includes('locality'),
  )?.short_name;

  states = details?.address_components?.find(addressComponent =>
    addressComponent?.types.includes('administrative_area_level_1'),
  )?.short_name;

  street = details?.address_components?.find(addressComponent =>
    addressComponent?.types.includes('route'),
  )?.short_name;

  country = details?.address_components?.find(addressComponent =>
    addressComponent?.types?.includes('country'),
  )?.long_name;

  let country_sort = details?.address_components?.find(addressComponent =>
    addressComponent?.types?.includes('country'),
  )?.short_name;
  country_id = callingCountries[`${country_sort}`]?.countryCallingCodes[0];
  address = details?.formatted_address;
  latitude = details?.geometry?.location?.lat;
  longitude = details?.geometry?.location?.lng;
  let data = {
    country_code: country_sort,
    city: city,
    states: states,
    street: street,
    country: country,
    latitude: latitude,
    longitude: longitude,
    pincode: pincode,
    phonecode: country_id,
    address: address,
    // address_type: '1',
  };
  if (update == 'update') {
    let data = {
      code: country_sort,
      city: city,
      states: states,
      street: street,
      country: country,
      latitude: latitude,
      longitude: longitude,
      pincode: pincode,
      country_id: country_id,
      address: address,
      // address_type: '1',
    };
    return data;
  }
  return data;
}

export const sessionHandler = error => {
  actions.userLogout();
  actions.cartItemQty('');
  actions.saveAddress(null);
  actions.setAppSessionData('guest_login');
  AsyncStorage.clear();
};

export const getScaleTransformationStyle = (
  // animated: Animated.Value,
  // startSize: number = 1,
  // endSize: number = 0.95,
  /** Removing annoataions commented above original code in case of any issue arise */
  animated,
  startSize = 1,
  endSize = 0.95,
) => {
  const interpolation = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [startSize, endSize],
  });
  return {
    transform: [{scale: interpolation}],
  };
};

export const pressInAnimation = (
  // animated: Animated.Value,
  // duration: number = 150,
  /** Removing annoataions commented above original code in case of any issue arise */
  animated,
  duration = 150,
) => {
  animated.setValue(0);
  Animated.timing(animated, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  }).start();
};

export const pressOutAnimation = (
  // animated: Animated.Value,
  // duration: number = 150,
  /** Removing annoataions commented above original code in case of any issue arise */
  animated,
  duration = 150,
) => {
  animated.setValue(1);
  Animated.timing(animated, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  }).start();
};

const getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

const getUrlRoutes = (url, indexOfRoute) => {
  const route = url.replace(/.*?:\/\//g, '');
  const routeName = route.split('/')[0 + indexOfRoute];

  return routeName;
};

export async function getCoords() {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      {enableHighAccuracy: true, timeout: 10000},
    );
  });
}

// export async function getCountryFromCoords(lat, lon) {
//   const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

//   const response = await fetch(url, {
//     headers: {
//       'User-Agent': 'Cabjak/2.0', // Nominatim requires this
//     },
//   });
//   console.log(response, 'disdjijdjidsj');
//   const data = await response.json();
//   console.log(data, 'euhhidiidsihhd');

//   return data?.address?.country_code?.toUpperCase() || null;
// }

function inBox(lat, lon, minLat, maxLat, minLon, maxLon) {
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

export const getCountryFromCoords = async (lat, lon) => {
  if (inBox(lat, lon, 28.5, 30.2, 46.5, 48.6)) return "KW";
  if (inBox(lat, lon, 16.3, 32.2, 34.5, 55.7)) return "SA";
  if (inBox(lat, lon, 16.6, 26.6, 51.8, 59.9)) return "KW";
  return "KW";
};

const timeInLocalLangauge = (value, selectedLanguage) => {
  return `${value.toLocaleDateString(selectedLanguage, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}, ${value.toLocaleTimeString(selectedLanguage, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const getNearestLocation = async (currentLocation, savedLocations = []) => {
  const points = savedLocations?.map((item, indx) => {
    const distance = getDistance(
      {
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      },
      {latitude: item?.latitude, longitude: item?.longitude},
    );
    var newAddressArray = Object.assign({}, indx);
    newAddressArray.distance = distance;
    newAddressArray.latitude = parseFloat(item?.latitude);
    newAddressArray.longitude = parseFloat(item?.longitude);
    newAddressArray.address = item?.address;
    newAddressArray.type = item?.type;
    newAddressArray.type_name = item?.type_name;

    return newAddressArray;
  });

  const minDistance = Math.min.apply(
    null,
    points.map(function (item) {
      return item?.distance;
    }),
  );

  const nearestAddress = points.find(x => x.distance === minDistance);
  return nearestAddress;
};

// const timeConvert = (n) => {
//   var num = n;
//   var hours = num / 60;
//   var rhours = Math.floor(hours);
//   var minutes = (hours - rhours) * 60;
//   var rminutes = Math.round(minutes);
//   if (num >= 60) {
//     if(minutes>=30){
//     return Math.ceil(hours) + 'h'// + '≈'
//     }else{
//     return rhours + 'h'//+ '≈'
//     }
//     } else {
//     return rminutes + `${strings.MINS}` //+ '≈';
//     }
//   // return num >= 60
//   //   ? rhours + 'h :' + rminutes + `${strings.MINS}`
//   //   : rminutes + `${strings.MINS}`;
// };

const timeConvert = n => {
  var num = n;
  var hours = num / 60;
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);

  if (num >= 60) {
    if (minutes >= 30) {
      return Math.ceil(hours) + 'h'; // + '≈'
    } else {
      return rhours + 'h'; //+ '≈'
    }
  } else {
    return rminutes + `${strings.MINS}`; //+ '≈';
  }
  // return num >= 60
  // ? rhours + 'h' //+ rminutes + ${strings.MINS}
  // : rminutes + ${strings.MINS};
};

const checkEvenOdd = num => {
  return timeConvert(num);
};

const playVibration = () => {
  const ONE_SECOND_IN_MS = 1;

  Vibration.vibrate([
    1 * ONE_SECOND_IN_MS,
    2 * ONE_SECOND_IN_MS,
    3 * ONE_SECOND_IN_MS,
  ]);
};

const playHapticEffect = (effect = 'clockTick') => {
  const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: true,
  };

  ReactNativeHapticFeedback.trigger(effect, options);
};

const hapticEffects = {
  effectClick: 'effectClick',
  effectDoubleClick: 'effectDoubleClick',
  effectHeavyClick: 'effectHeavyClick',
  effectTick: 'effectTick',
  impactHeavy: 'impactHeavy',
  impactMedium: 'impactMedium',
  impactLight: 'impactLight',
  notificationError: 'notificationError',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  rigid: 'rigid',
  selection: 'selection',
  soft: 'soft',

  // (Android only)
  clockTick: 'clockTick',
  contextClick: 'contextClick',
  keyboardPress: 'keyboardPress',
  keyboardRelease: 'keyboardRelease',
  keyboardTap: 'keyboardTap',
  longPress: 'longPress',
  textHandleMove: 'textHandleMove',
  virtualKey: 'virtualKey',
  virtualKeyRelease: 'virtualKeyRelease',
};

// export function numberFormat(formatableObj = {}) {
//   return (
//     <NumberFormat
//       value={formatableObj?.number}
//       displayType={'text'}
//       thousandSeparator={true}
//       prefix={formatableObj?.currencySign}
//       renderText={(formattedValue) => (
//         <Text numberOfLines={1} style={formatableObj?.textStyle}>
//           {formattedValue}
//         </Text>
//       )}
//     />
//   );
// }

const getTabBarVisibility = (route, navigation, screen) => {
  if (navigation && navigation.isFocused && navigation.isFocused()) {
    const route_name = getFocusedRouteNameFromRoute(route);
    console.log('getTabBarVisibilityScreenRouteName', route_name);

    console.log('getTabBarVisibilityScreen', screen);

    console.log('getTabBarVisibility', screen.includes(route_name));

    if (screen.includes(route_name)) {
      // showBottomBar_ = false;
      return false;
    }
    // showBottomBar_ = true;
    return true;
  }
};

export function getPhoneNumberFromPhoneBook() {
  return new Promise((resolve, reject) => {
    selectContactPhone()
      .then(selection => {
        resolve(selection);
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function deviceCountryCode() {
  return new Promise((resolve, reject) => {
    DeviceCountry.getCountryCode()
      .then(result => {
        resolve(codes.filter(x => x.isoCode2 == result.code.toUpperCase()));
      })
      .catch(error => {
        reject(error);
      });
  });
}

// export const getPaymentGatewayResponseWithUri = async (Weburi) => {
//   try {
//     const response = await fetch(
//       Weburi, {
//       method: "GET",
//     }
//     );
//     const res = await response
//     return res;
//   } catch (error) {
//     return error
//   }
// };

export function redirectFromNotification(clickActionUrl = null) {
  setTimeout(() => {
    NavigationService.navigate(navigationStrings.NOTIFICATION);
  }, 800);
  // if (clickActionUrl) {
  //   // redirectToData[0] for redirection to vendor or category
  //   //redirectToData[1] for name of vendor or category
  //   // redirectToData[2] for getting id of vendor or category
  //   let redirectToData = clickActionUrl.split('/');
  //   if (redirectToData[2]) {
  //     if (
  //       redirectToData[0] == staticStrings.VENDOR ||
  //       redirectToData[0] == staticStrings.PRODUCT ||
  //       redirectToData[0] == staticStrings.CATEGORY ||
  //       redirectToData[0] == staticStrings.ONDEMANDSERVICE ||
  //       redirectToData[0] == staticStrings.LAUNDRY
  //     ) {
  //       NavigationService.navigate(navigationStrings.TAB_ROUTES, {
  //         screen: navigationStrings.HOMESTACK,
  //         params: {
  //           screen: navigationStrings.PRODUCT_LIST,
  //           params: {
  //             data: {
  //               id: redirectToData[2],
  //               vendor:
  //                 redirectToData[0] == staticStrings.CATEGORY ||
  //                 redirectToData[0] == staticStrings.VENDOR
  //                   ? true
  //                   : false,
  //               name: redirectToData[1],
  //               fetchOffers: true,
  //             },
  //           },
  //         },
  //       });
  //     } else if (redirectToData[0] == staticStrings.SUBCATEGORY) {
  //       NavigationService.navigate(navigationStrings.TAB_ROUTES, {
  //         screen: navigationStrings.HOMESTACK,
  //         params: {
  //           screen: navigationStrings.VENDOR_DETAIL,
  //           params: {
  //             data: {
  //               item: {
  //                 id: redirectToData[2],
  //                 name: redirectToData[1],
  //                 redirect_to: staticStrings.SUBCATEGORY,
  //               },
  //             },
  //           },
  //         },
  //       });
  //     }
  //   }
  // }
}
const tabBarVisibilityConfig = currentRouteName => {
  const routesNeedToHideTabBar = [
    navigationStrings.LEADER_BOARD,
    navigationStrings.WATCH,
    navigationStrings.PICKUPTAXIORDERDETAILS,
    navigationStrings.ORDER_DETAIL,
    navigationStrings.CHOOSECARTYPEANDTIMETAXI,
    navigationStrings.PAYMENT_OPTIONS,
    navigationStrings.CHOOSECARTYPEANDTIME,
    navigationStrings.OFFERS2,
  ];
  return routesNeedToHideTabBar.includes(currentRouteName);
};

const logFirebaseEvent = (eventName, params = {}) => {
  if (typeof eventName !== 'string' || eventName.length === 0) {
    console.warn('logFirebaseEvent: Invalid eventName:', eventName);
    return;
  }

  if (typeof params !== 'object') {
    console.warn('logFirebaseEvent: params should be an object:', params);
    params = {};
  }

  // Optional: Log event locally in development for debugging
  // if (__DEV__) {
  //   console.log(`Logging Firebase event: ${eventName}`, params);
  // }

  // Log event to Firebase Analytics
  analytics()
    .logEvent(eventName, params)
    .catch(error => {
      // Log the error somewhere (console, error reporting service, etc)
      console.error(`Failed to log Firebase event: ${eventName}`, error);
    });
};

const setFirebaseUserProperty = async (propertyName, value) => {
  if (typeof propertyName !== 'string' || !propertyName.trim()) {
    console.warn(
      'Firebase Analytics: Invalid user property name',
      propertyName,
    );
    return;
  }
  if (typeof value !== 'string') {
    console.warn(
      'Firebase Analytics: User property value should be string',
      value,
    );
    return;
  }

  // if (__DEV__) {
  //   console.log(`[Analytics] setUserProperty: ${propertyName} = ${value}`);
  // }

  try {
    await analytics().setUserProperty(propertyName, value);
  } catch (error) {
    console.error(
      `[Analytics] Failed to set user property ${propertyName}`,
      error,
    );
  }
};

const logFirebaseScreenView = async (screenName, screenClassOverride) => {
  if (typeof screenName !== 'string' || !screenName.trim()) {
    console.warn('Firebase Analytics: Invalid screen name', screenName);
    return;
  }

  // if (__DEV__) {
  //   console.log(`[Analytics] logScreenView: ${screenName}`);
  // }

  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClassOverride || screenName,
    });
  } catch (error) {
    console.error(`[Analytics] Failed to log screen view ${screenName}`, error);
  }
};

// Optionally reset analytics data (e.g., on logout)
const resetFirebaseAnalytics = async () => {
  try {
    await analytics().resetAnalyticsData();
    // if (__DEV__) {
    //   console.log('[Analytics] resetAnalyticsData called');
    // }
  } catch (error) {
    console.error('[Analytics] Failed to reset analytics data', error);
  }
};

export {
  androidBackButtonHandler,
  checkEvenOdd,
  getCurrentLocation,
  getNearestLocation,
  getParameterByName,
  getTabBarVisibility,
  getUrlRoutes,
  hapticEffects,
  playHapticEffect,
  playVibration,
  renameKey,
  showError,
  showInfo,
  showSuccess,
  tabBarVisibilityConfig,
  timeInLocalLangauge,
  logFirebaseEvent,
  setFirebaseUserProperty,
  logFirebaseScreenView,
  resetFirebaseAnalytics,
};
