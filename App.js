import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-community/clipboard';
import NetInfo from '@react-native-community/netinfo';
import React, {useEffect, useRef, useState} from 'react';
import {Linking, Platform, Text, View} from 'react-native';
import codePush from 'react-native-code-push';
import FlashMessage from 'react-native-flash-message';
import Modal from 'react-native-modal';
import {MenuProvider} from 'react-native-popup-menu';
import * as Progress from 'react-native-progress';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {Provider} from 'react-redux';
import NotificationModal from './src/Components/NotificationModal';
import strings from './src/constants/lang';
import Routes from './src/navigation/Routes';
import actions from './src/redux/actions';
import {updateInternetConnection} from './src/redux/actions/auth';
import {clearLastBidData} from './src/redux/actions/home';
import {setCountry} from './src/redux/actions/init';
import store from './src/redux/store';
import types from './src/redux/types';
import PrinterScreen from './src/Screens/PrinterConnection/PrinterScreen';
import colors from './src/styles/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from './src/styles/responsiveSize';
import ForegroundHandler from './src/utils/ForegroundHandler';
import {
  getUrlRoutes,
  showError,
  showSuccess,
} from './src/utils/helperFunctions';
import {getItem, getLastBidInfo, getUserData, setItem} from './src/utils/utils';
import UpdateManager from './src/Screens/UpdateManager/UpdateManager';
import useIOSUpdateCheck from './src/Screens/IosUpdateManager/useIOSUpdateCheck';


// >>> Added for shared-location deep links (navigation helper + route keys)
import * as NavigationService from './src/navigation/NavigationService';
import navigationStrings from './src/navigation/navigationStrings';
// <<< Added


let CodePushOptions = {checkFrequency: codePush.CheckFrequency.MANUAL};


// >>> REPLACE your existing parseLatLngFromUrl with this:

// <<< END replacement



const App = () => {
  const [progress, setProgress] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('red');
  const isConnectedRef = useRef(null);

   // prevent duplicate deep-link handling
  const lastHandledUrlRef = React.useRef(null);

    // --- Map / Geo URL detection helper ---
 


  const ConnectBTFunction = async () => {
    await AsyncStorage.removeItem('autoConnectEnabled');

    const temp = new PrinterScreen();

    AsyncStorage.getItem('BleDevice2').then(res => {
      const tt = JSON.parse(res);
      temp.connectBTFunc({
        address: tt.boundAddress,
        name: tt.name,
      });
    });
    AsyncStorage.removeItem('BleDevice2');
  };

  if (!__DEV__) {
    console.log = () => null;
  }

  // >>> call handleDynamicLink on cold start + when app is already open


// <<< end add

  // useEffect(() => {
  //   Linking.getInitialURL().then(link => handleDynamicLink(link));
  //   Linking.addEventListener('url', event => handleDynamicLink(event.url));
  //   return () => {
  //     Linking.removeEventListener('url', event => handleDynamicLink(event.url));
  //   };
  // }, [handleDynamicLink]);

  // useEffect(() => {
  //   const unsubscribe = NetInfo.addEventListener(state => {
  //     const netStatus =
  //       state.isConnected && state.isInternetReachable !== false;
  //     updateInternetConnection(netStatus);
  //     // setinternetStatus(netStatus);
  //     if (netStatus !== isConnectedRef.current) {
  //       isConnectedRef.current = netStatus;
  //       if (netStatus) {
  //         showSuccess(strings.CONNECTIONBACK);
  //       } else {
  //         showError(strings.NOINTERNET);
  //       }
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);
  // async function handleDynamicLink(deepLinkUrl) {
  //   console.log(deepLinkUrl, 'deepLinkUrldeepLinkUrsssl');
  //   if (deepLinkUrl != null) {
  //     setItem('deepLinkUrl', deepLinkUrl)
  //       .then(res => {
  //         actions.setDeeplinkUrl(deepLinkUrl);
  //       })
  //       .catch(error => {
  //         console.log(error, 'erroror');
  //       });

  //     let routeName = getUrlRoutes(deepLinkUrl, 2);
  //     let routeName2 = getUrlRoutes(deepLinkUrl, 3);
  //     let routeName4 = getUrlRoutes(deepLinkUrl, 4);
  //     console.log(routeName2, 'routeName');
  //     if (routeName === 'vendor') {
  //       return;
  //     } else if (routeName === 'track') {
  //       openSpecificScreenByDeeplink(deepLinkUrl);
  //     }
  //     if (routeName2 == 'share_refer_link') {
  //       openSpecificScreenByDeeplink(deepLinkUrl, routeName2, routeName4);
  //     }
  //   }
  // }

 async function handleDynamicLink(deepLinkUrl) {
  try {
    deepLinkUrl = (deepLinkUrl || '').trim();
    if (!deepLinkUrl) return;

    // ignore duplicates
    if (lastHandledUrlRef.current === deepLinkUrl) {
      console.log('↩️ Skipping duplicate deep link:', deepLinkUrl);
      return;
    }

    console.log('🔗 handleDynamicLink got:', deepLinkUrl);

    // --- Map/geo branch -----------------------------------------
    const isMap = typeof isMapLink === 'function' ? isMapLink(deepLinkUrl) : false;
    console.log('🧭 isMapLink ?', isMap);

    if (isMap) {
      let parsed = {};
      try {
        parsed = typeof parseLatLngFromUrl === 'function'
          ? (parseLatLngFromUrl(deepLinkUrl) || {})
          : {};
      } catch (e) {
        console.log('❌ parseLatLngFromUrl error:', e);
      }
      console.log('🧭 parsed map payload:', JSON.stringify(parsed));


      const { lat, lng, address } = parsed;

      if ((lat != null && lng != null) || address) {
        const prefillAdress = {
          isFromSharedLocation: true,
          task_type_id: 2, // drop-off
          ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
          ...(address
            ? { address, pre_address: address }
            : (lat != null && lng != null
                ? { address: `${lat}, ${lng}`, pre_address: `${lat}, ${lng}` }
                : {})),
        };

       console.log('🚀 Deep link → Addaddress with:', JSON.stringify(prefillAdress));


        // mark as handled before navigating
        lastHandledUrlRef.current = deepLinkUrl;

        const targetRoute =
          (navigationStrings && navigationStrings.ADDADDRESS) || 'Addaddress';

        // small delay ensures navigator stack is ready after cold start
        setTimeout(() => {
          NavigationService.navigate(targetRoute, { prefillAdress });
        }, 150);

        return; // IMPORTANT: stop after handling map link
      } else {
        console.log('⚠️ Map link parsed, but no lat/lng or address found. Skipping map navigate.');
        // fall through to your existing (vendor/track/share) logic below
      }
    }
    // --- end Map/geo branch -------------------------------------

    // Your existing logic (unchanged)
    try {
      await setItem('deepLinkUrl', deepLinkUrl);
      actions.setDeeplinkUrl(deepLinkUrl);
    } catch (error) {
      console.log('setItem error', error);
    }

    let routeName = getUrlRoutes(deepLinkUrl, 2);
    let routeName2 = getUrlRoutes(deepLinkUrl, 3);
    let routeName4 = getUrlRoutes(deepLinkUrl, 4);
    console.log('handleDynamicLink routeName2:', routeName2);

    if (routeName === 'vendor') {
      lastHandledUrlRef.current = deepLinkUrl;
      return;
    } else if (routeName === 'track') {
      lastHandledUrlRef.current = deepLinkUrl;
      openSpecificScreenByDeeplink(deepLinkUrl);
      return;
    }

    if (routeName2 === 'share_refer_link') {
      lastHandledUrlRef.current = deepLinkUrl;
      openSpecificScreenByDeeplink(deepLinkUrl, routeName2, routeName4);
    }

  } catch (err) {
    console.log('❌ handleDynamicLink error:', err);
  }
}

  if (Platform.OS === 'ios') {
    useIOSUpdateCheck();
  }

  const openSpecificScreenByDeeplink = async (
    deepLinkUrl,
    routeName = null,
    referalcode = null,
  ) => {
    const userData = await getUserData();
    if (userData?.auth_token && deepLinkUrl) {
      if (routeName === 'share_refer_link') {
        actions.setRedirection('from_deepLinking_link');
        actions.setAppSessionData('shortcode');
        // NavigationService.navigate(navigationStrings.TAB_ROUTES, {
        //   screen: navigationStrings.HOMESTACK,
        //   // params: {
        //   //   screen: navigationStrings.VENDOR_DETAIL,

        //   // },
        // });
        actions.setReferralCode(referalcode);
      } else {
        actions.setRedirection('from_deepLinking');
        actions.setAppSessionData('shortcode');
      }
    } else {
      setTimeout(() => {
        actions.setAppSessionData('on_login');
      }, 1000);
    }
  };

  useEffect(() => {
    //stop splashs screen from loading

    setTimeout(() => {
      SplashScreen.hide();
    }, 3000);
    if (Platform.OS == 'android') {
      AsyncStorage.getItem('autoConnectEnabled').then(res => {
        if (res !== null) {
          ConnectBTFunction();
        }
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      const userData = await getUserData();
      const {dispatch} = store;
      if (userData && !!userData?.auth_token) {
        let lastBidData = await getLastBidInfo();
        if (!!lastBidData && !!lastBidData?.expiryTime) {
          let expiryDate = new Date(lastBidData?.expiryTime);
          let currentDate = new Date();
          if (currentDate >= expiryDate) {
            clearLastBidData();
          } else {
            dispatch({
              type: types.LAST_BID_INFO,
              payload: lastBidData,
            });
          }
        }

        dispatch({
          type: types.LOGIN,
          payload: userData,
        });
      }
      const getAppData = await getItem('appData');

      if (!!getAppData) {
        dispatch({
          type: types.APP_INIT,
          payload: getAppData,
        });
      }

      const locationData = await getItem('location');
      if (!!locationData) {
        dispatch({
          type: types.LOCATION_DATA,
          payload: locationData,
        });
      }

      const profileAddress = await getItem('profileAddress');

      if (!!profileAddress) {
        dispatch({
          type: types.PROFILE_ADDRESS,
          payload: profileAddress,
        });
      }

      const cartItemCount = await getItem('cartItemCount');

      if (!!cartItemCount) {
        dispatch({
          type: types.CART_ITEM_COUNT,
          payload: cartItemCount,
        });
      }

      const allUserAddress = await getItem('saveUserAddress');

      if (!!allUserAddress) {
        dispatch({
          type: types.SAVE_ALL_ADDRESS,
          payload: allUserAddress,
        });
      }

      const walletData = await getItem('walletData');
      if (!!walletData) {
        dispatch({
          type: types.WALLET_DATA,
          payload: walletData,
        });
      }

      const selectedAddress = await getItem('saveSelectedAddress');
      if (!!selectedAddress) {
        dispatch({
          type: types.SELECTED_ADDRESS,
          payload: selectedAddress,
        });
      }

      const dine_in_type = await getItem('dine_in_type');
      if (!!dine_in_type) {
        dispatch({
          type: types.DINE_IN_DATA,
          payload: dine_in_type,
        });
      }
      const theme = await getItem('theme');
      const themeToggle = await getItem('istoggle');
      if (JSON.parse(themeToggle)) {
        dispatch({
          type: types.THEME,
          payload: false,
        });
        dispatch({
          type: types.THEME_TOGGLE,
          payload: !!themeToggle ? JSON.parse(themeToggle) : false,
        });
      } else {
        dispatch({
          type: types.THEME_TOGGLE,
          payload: !!themeToggle ? JSON.parse(themeToggle) : false,
        });
        if (JSON.parse(theme)) {
          dispatch({
            type: types.THEME,
            payload: true,
          });
        } else {
          dispatch({
            type: types.THEME,
            payload: false,
          });
        }
      }

      const searchResult = await getItem('searchResult');

      if (!!searchResult) {
        dispatch({
          type: types.ALL_RECENT_SEARCH,
          payload: searchResult,
        });
      }

      //Language
      const getLanguage = await getItem('language');

      if (!!getLanguage) {
        strings.setLanguage(getLanguage);
      }
      const getCountry = await getItem('setPrimaryCountry');

      if (!!getCountry) {
        setCountry(getCountry);
      }

      //saveShortCode
      const saveShortCode = await getItem('saveShortCode');
      if (!!saveShortCode) {
        dispatch({
          type: types.SAVE_SHORT_CODE,
          payload: saveShortCode,
        });
      }
      //Gamil configure
      // GoogleSignin.configure();

      // clip copy issue
      if (__DEV__) {
        Clipboard.setString('');
      }
    })();
    // .then(() => {
    //   chekLocationPermission(true);
    // })
    return () => {};
  }, []);

  // Check internet connection

  const {blurRef} = useRef();

  // useEffect(() => {
  //   codePush.sync(
  //     {
  //       installMode: codePush.InstallMode.IMMEDIATE,
  //       updateDialog: true,
  //     },
  //     codePushStatusDidChange,
  //     codePushDownloadDidProgress,
  //   );
  // }, []);

  function codePushStatusDidChange(syncStatus) {
    switch (syncStatus) {
      case codePush.SyncStatus.CHECKING_FOR_UPDATE:
        console.log('codepush status Checking for update');
        break;
      case codePush.SyncStatus.DOWNLOADING_PACKAGE:
        console.log('codepush status Downloading package');
        break;
      case codePush.SyncStatus.AWAITING_USER_ACTION:
        console.log('codepush status Awaiting user action');
        break;
      case codePush.SyncStatus.INSTALLING_UPDATE:
        console.log('codepush status Installing update');
        setProgress(false);
        break;
      case codePush.SyncStatus.UP_TO_DATE:
        console.log('codepush status App up to date+++');
        setProgress(false);
        break;
      case codePush.SyncStatus.UPDATE_IGNORED:
        console.log('codepush status Update cancelled by user');
        setProgress(false);
        break;
      case codePush.SyncStatus.UPDATE_INSTALLED:
        console.log(
          'codepush status Update installed and will be applied on restart',
        );
        setProgress(false);
        break;
      case codePush.SyncStatus.UNKNOWN_ERROR:
        console.log('codepush status An unknown error occurred.');
        setProgress(false);
        break;
    }
  }

  function codePushDownloadDidProgress(progress) {
    console.log('codepush status progress status', progress);
    setProgress(progress);
  }


  // >>> Added: effect to open Cabjak from shared map/location links
useEffect(() => {
  const openFromUrl = (url) => {
    if (!url) return;

    const {lat, lng, address} = parseLatLngFromUrl(url);
    const prefillAdress = { isFromSharedLocation: true, task_type_id: 2 };

    if (lat != null && lng != null) {
      prefillAdress.latitude = lat;
      prefillAdress.longitude = lng;
      prefillAdress.address = address || `${lat}, ${lng}`;
      prefillAdress.pre_address = prefillAdress.address;
    } else if (address) {
      prefillAdress.address = address;
      prefillAdress.pre_address = address;
    } else {
      return;
    }

    const targetRoute =
      (navigationStrings && navigationStrings.ADDADDRESS) || 'Addaddress';

    NavigationService.navigate(targetRoute, { prefillAdress });
  };

  Linking.getInitialURL().then(openFromUrl);
  const sub = Linking.addEventListener('url', e => openFromUrl(e.url));
  return () => sub.remove();
}, []);
// <<< Added



  const progressView = () => {
    return (
      <View>
        <Modal isVisible={true}>
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: moderateScale(8),
              padding: moderateScale(16),
            }}>
            <Text
              style={{
                alignSelf: 'center',

                color: colors.blackOpacity70,
                fontSize: textScale(14),
              }}>
              In Progress...
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: moderateScaleVertical(12),
                marginBottom: moderateScaleVertical(4),
              }}>
              <Text
                style={{
                  color: colors.blackOpacity70,
                  fontSize: textScale(12),
                }}>{`${(Number(progress?.receivedBytes) / 1048576).toFixed(
                2,
              )}MB/${(Number(progress.totalBytes) / 1048576).toFixed(
                2,
              )}MB`}</Text>

              <Text
                style={{
                  color: primaryColor,

                  fontSize: textScale(12),
                }}>
                {(
                  (Number(progress?.receivedBytes) /
                    Number(progress.totalBytes)) *
                  100
                ).toFixed(0)}
                %
              </Text>
            </View>

            <Progress.Bar
              progress={
                (
                  (Number(progress?.receivedBytes) /
                    Number(progress.totalBytes)) *
                  100
                ).toFixed(0) / 100
              }
              width={width / 1.2}
              color={'red'}
            />
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <MenuProvider>
        <Provider ref={blurRef} store={store}>
          <ForegroundHandler />
          {progress ? progressView() : null}
          <Routes />
          <NotificationModal />
        </Provider>
      </MenuProvider>
      <UpdateManager />
      <FlashMessage position="top" />
      {/* <NoInternetModal show={!internetConnection} /> */}
    </SafeAreaProvider>
  );
};

export default codePush(CodePushOptions)(App);
