import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {isEmpty} from 'lodash';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  I18nManager,
  Image,
  InteractionManager,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {getBundleId} from 'react-native-device-info';
import {useDarkMode} from 'react-native-dynamic';
import * as RNLocalize from 'react-native-localize';
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Modal from 'react-native-modal';
import {useSelector} from 'react-redux';
import AddressModal3 from '../../../Components/AddressModal3';
import GradientButton from '../../../Components/GradientButton';
import CategoryLoader2 from '../../../Components/Loaders/CategoryLoader2';
import MapCarMark from '../../../Components/MapCarMark';
import TaxiBannerHome from '../../../Components/TaxiBannerHome';
import TaxiHomeCategoryCard from '../../../Components/TaxiHomeCategoryCard';
import WrapperContainer from '../../../Components/WrapperContainer';
import imagePath from '../../../constants/imagePath';
import strings from '../../../constants/lang';
import ActionSheet from 'react-native-actionsheet';

import navigationStrings from '../../../navigation/navigationStrings';
import actions from '../../../redux/actions';
import colors from '../../../styles/colors';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../../styles/responsiveSize';
import {MyDarkTheme} from '../../../styles/theme';
import {appIds} from '../../../utils/constants/DynamicAppKeys';
import {blueMapStyle} from '../../../utils/constants/MapStyle';
import {
  getColorCodeWithOpactiyNumber,
  getCoords,
  getCountryFromCoords,
  getUrlRoutes,
  showError,
  showSuccess,
} from '../../../utils/helperFunctions';
import useInterval from '../../../utils/useInterval';
import stylesFunc from '../styles';
import {setItem} from '../../../utils/utils';
import {
  getAddressFromLatLong,
  placesGeoCoding,
} from '../../../utils/googlePlaceApi';

export default function TaxiHomeDashbord({
  handleRefresh = () => {},
  isRefreshing = false,
  onPressCategory = () => {},
  location = {},
  curLatLong = {},
  currentLocation = {},
}) {
  const navigation = useNavigation();
  const theme = useSelector(state => state?.initBoot?.themeColor);
  const toggleTheme = useSelector(state => state?.initBoot?.themeToggle);
  const userData = useSelector(state => state?.auth?.userData);
  const completeData = useSelector(state => state?.initBoot);

  const [onRoadDrivers, setonRoadDrivers] = useState([]);
  const [liveWalletAmount, setliveWalletAmount] = useState(0);
  const [selectedGender, setselectedGender] = useState(null);
  const [driverTypes, setdriverTypes] = useState([]);
  const [selectedDriverType, setselectedDriverType] = useState(null);
  const [fetchVideoLanguage, setfetchVideoLanguage] = useState([]);
  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = toggleTheme ? darkthemeusingDevice : theme;
  const {appData, currencies, themeColors, appStyle, languages} = useSelector(
    state => state?.initBoot,
  );
  const isFocused = useIsFocused();
  const lastHandledUrlRef = React.useRef(null);
  const mapRef = useRef();
  const [state, setState] = useState({
    slider1ActiveSlide: 0,
    date: new Date(),
    allSavedAddress: [],
    isVisible: false,
    isVisible1: false,
    updateData: {},
    indicator: false,
    type: 'addAddress',
    newAddressAdded: null,
    isLoadingModal: true,
    fullMapShow: false,
    isVisibleAddressModal: false,
    pickupAddress: {},
    allListedDrivers: [],
    isLoading: true,
  });
  const [categoryLoader, setcategoryLoader] = useState(false);
  const appMainData = useSelector(state => state?.home?.appMainData);
  useEffect(() => {
    if (!!appMainData?.categories) {
      updateState({isLoadingModal: false});
    }
  }, [appMainData]);
  const fontFamily = appStyle?.fontSizeData;
  const {bannerRef} = useRef();
  const {
    slider1ActiveSlide,
    allSavedAddress,
    isVisible,
    date,
    isVisible1,
    updateData,
    indicator,
    type,
    del,
    isLoadingModal,
    fullMapShow,
    selectViaMap,
    allListedDrivers,
    isLoading,
  } = state;
  const styles = stylesFunc({themeColors, fontFamily});
  const updateState = data => setState(state => ({...state, ...data}));
  const [showTutorialModal, setshowTutorialModal] = useState(false);
  let actionSheetGender = useRef();
  let actionSheetDriverType = useRef();
  const showActionSheetGender = () => {
    actionSheetGender.current.show();
  };
  const showActionSheetDriverType = () => {
    actionSheetDriverType.current.show();
  };

  useEffect(() => {
     actions
      .getKuwaitiId(
        {
                "serviceDescriptionEN": "Cabjak ride booking and transportation service",
                "serviceDescriptionAR": "خدمة حجز الرحلات والنقل عبر تطبيق كابجاك",
                "authenticationReasonEn": "To verify your identity and securely access the Cabjak service",
                "authenticationReasonAr": "للتحقق من هويتك وتمكينك من استخدام خدمات كابجاك بشكل آمن",
                "additionalData": "hvAHDV",
                "challenge": "HBEFHB",
                "requestUserDetails": true
              },
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      ).then((res)=>{
        console.log(res?.data?.qrCodeImage,'uhuhuuhhuuuh')
        const imgUri = `data:image/jpeg;base64,${res?.data?.qrCodeImage}`;
        
      }).catch((error)=>{
        console.log(error,'ygyyygffttfft')
      })
    makeDrivertype();
  }, []);

  const makeDrivertype = async () => {
    const {latitude, longitude} = await getCoords();
    const countryCode = await getCountryFromCoords(latitude, longitude);
    if (countryCode === 'SA') {
      setdriverTypes([strings.SAUDICAP, strings.OTHERS2,  strings.ALL, strings.CANCEL]);
    } else {
      setdriverTypes([strings.GCCCAPT, strings.OTHERS2, strings.ALL, strings.CANCEL]);
    }
  };



  //   useFocusEffect(
  //   React.useCallback(() => {
  //     const task = InteractionManager.runAfterInteractions(() => {
  //       if (currentLocation?.latitude) {
  //       mapRef?.current?.animateCamera(
  //         {
  //           center: {
  //             latitude: parseFloat(currentLocation?.latitude),
  //             longitude: parseFloat(currentLocation?.longitude),
  //           },
  //           zoom: 17,
  //           pitch: 54,
  //           altitude: 1000,
  //           heading: 0,
  //         },
  //         {duration: 3200}, // in ms
  //       );
  //     }
  //     });

  //     return () => task.cancel();
  //   }, [currentLocation])
  // );

  React.useEffect(() => {
    // Cold start
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          handleDynamicLink(url);
        }
      })
      .catch(err => console.log('initialURL error', err));

    // Warm start
    const sub = Linking.addEventListener('url', e => {
      console.log('🔗 event url:', e?.url);
      handleDynamicLink(e?.url);
    });

    return () => {
      try {
        sub?.remove && sub.remove();
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    actions
      .getTutorialType(
        '',
        {},
        {
          code: appData?.profile?.code,
        },
      )
      .then(res => {
        if (!!res?.data) {
          const values = Object.values(res?.data);
          setfetchVideoLanguage(values);
        }
      })
      .catch(err => console.log(err, 'fdifudufufdh'));
  }, []);

  let myCategories = [{data: []}];

  if (!isEmpty(appMainData?.homePageLabels)) {
    myCategories =
      !!appMainData?.homePageLabels &&
      appMainData?.homePageLabels.filter((val, i) => {
        if (val.slug == 'nav_categories') {
          return val;
        }
      });
  } else {
    myCategories = !isEmpty(appMainData?.categories) && [
      {data: appMainData?.categories || []},
    ];
  }

  useEffect(() => {
    if (appMainData?.categories?.length === undefined) {
      setcategoryLoader(true);
    } else {
      setcategoryLoader(false);
    }
  }, [appMainData?.categories]);

  useEffect(() => {
    if (!!appMainData?.categories) {
      updateState({isLoadingModal: false, isLoading: false});
    }
  }, [appMainData]);

  useEffect(() => {
    if (allListedDrivers && allListedDrivers?.length) {
      let arr = [];
      allListedDrivers?.map((i, inx) => {
        if (
          i &&
          i?.agentlog?.lat &&
          i?.agentlog?.lat != NaN &&
          i?.agentlog?.long != NaN
        ) {
          arr = [
            ...arr,
            {
              latitude: Number(i?.agentlog?.lat),
              longitude: Number(i?.agentlog?.long),
            },
          ];
        }
      });
      // animate(region);
      // fitPadding(arr);
    }
  }, []);

  useEffect(() => {
    if (userData?.auth_token) {
      getWalletData();
    }
  }, [isFocused]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      if (currentLocation?.latitude) {
        mapRef?.current?.animateCamera(
          {
            center: {
              latitude: parseFloat(currentLocation?.latitude),
              longitude: parseFloat(currentLocation?.longitude),
            },
            zoom: 17,
            pitch: 54,
            altitude: 1000,
            heading: 0,
          },
          {duration: Platform.OS === 'ios' ? 3000 : 3400}, // in ms
        );
      }
    });

    return () => task.cancel();
  }, [currentLocation]);

  useInterval(
    () => {
      getAllNearbyDrivers();
    },
    isFocused ? 5000 : null,
  );

  const getWalletData = () => {
    actions
      .walletHistory(
        '?page=1&limit=10',
        {},
        {
          code: appData?.profile?.code,
        },
      )
      .then(res => {
        setliveWalletAmount(res?.data?.wallet_amount);
      })
      .catch(err => console.log(err, 'fdifudufufdh'));
  };

  const getAllNearbyDrivers = () => {
    actions
      .getAllNearByDrivers(
        {
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        },
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      )
      .then(res => {
        if (!isEmpty(res?.data)) {
          fetchSnapped(res?.data);
        }
        updateState({
          allListedDrivers: res?.data,
          isLoading: false,
        });
      })
      .catch(error => {
        console.log(error, 'sduaydgafdtsfsa');
      });
  };

  const fetchSnapped = async allDrivers => {
    const snappedArray = await getSnappedLocations(allDrivers);
    setonRoadDrivers(snappedArray);
  };

  function isMapLink(rawUrl) {
    if (!rawUrl) return false;
    const s = String(rawUrl).trim().toLowerCase();

    // Direct geo or Google Maps app scheme
    if (s.startsWith('geo:')) return true;
    if (s.startsWith('comgooglemaps://')) return true;

    // Android intent wrapper for Maps (e.g. intent://maps...#Intent;scheme=geo;...)
    if (s.startsWith('intent://maps') || s.includes('scheme=geo')) return true;

    // Try URL parsing for https links
    try {
      const u = new URL(s);
      const host = u.hostname; // e.g. maps.app.goo.gl, www.google.com
      if (!host) return false;

      const allowHosts = [
        'google.com',
        'maps.google.com',
        'www.google.com',
        'maps.app.goo.gl',
        'goo.gl',
        'google.co',
        'www.google.co',
      ];

      const hostAllowed = allowHosts.some(
        h => host === h || host.endsWith('.' + h),
      );
      if (!hostAllowed) return false;

      // Heuristics that it’s really a maps link
      const isMapsPath = u.pathname.includes('/maps') || host.includes('maps');
      const qs = u.search || '';
      const looksLikeCoords = /(^|[?&])(q|query|ll|daddr|destination)=/.test(
        qs,
      );

      return isMapsPath || looksLikeCoords;
    } catch (e) {
      return false;
    }
  }

  async function handleDynamicLink(deepLinkUrl) {
    if (userData?.auth_token) {
      try {
        deepLinkUrl = (deepLinkUrl || '').trim();
        if (!deepLinkUrl) return;

        // ignore duplicates
        if (lastHandledUrlRef.current === deepLinkUrl) {
          return;
        }

        // --- Map/geo branch -----------------------------------------
        const isMap =
          typeof isMapLink === 'function' ? isMapLink(deepLinkUrl) : false;

        if (isMap) {
          let parsed = {};
          try {
            parsed =
              typeof parseLatLngFromUrl === 'function'
                ? parseLatLngFromUrl(deepLinkUrl) || {}
                : {};
          } catch (e) {
            console.log('❌ parseLatLngFromUrl error:', e);
          }
          console.log('🧭 parsed map payload:', JSON.stringify(parsed));

          const {lat, lng, address} = parsed;
          console.log(parsed, 'ffjfsijfsifi');
          if ((lat != null && lng != null) || address) {
            let combinedLn = lat + ',' + lng;
            const fullAddress = await getAddressFromLatLong(
              combinedLn,
              appData?.profile?.preferences?.map_key,
            );
            const prefillAdress = {
              isFromSharedLocation: true,
              task_type_id: 2, // drop-off
              ...(lat != null && lng != null
                ? {latitude: lat, longitude: lng}
                : {}),
              ...(fullAddress?.address
                ? {
                    address: fullAddress?.address,
                    pre_address: fullAddress?.address,
                  }
                : lat != null && lng != null
                ? {address: `${lat}, ${lng}`, pre_address: `${lat}, ${lng}`}
                : {}),
            };

            console.log(
              '🚀 Deep link → Addaddress with:',
              JSON.stringify(prefillAdress),
            );

            // mark as handled before navigating
            lastHandledUrlRef.current = deepLinkUrl;

            const targetRoute =
              (navigationStrings && navigationStrings.ADDADDRESS) ||
              'Addaddress';

            // small delay ensures navigator stack is ready after cold start
            setTimeout(() => {
              goToAddress({
                fromMap: false,
                newItem: true,
                prefillAdress: prefillAdress,
              });
            }, 1000);

            return; // IMPORTANT: stop after handling map link
          } else {
            console.log(
              '⚠️ Map link parsed, but no lat/lng or address found. Skipping map navigate.',
            );
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
    } else {
      setTimeout(() => {
        actions.setAppSessionData('on_login');
      }, 3000);
    }
  }

  function parseLatLngFromUrl(raw) {
    try {
      const s = String(raw || '').trim();

      // ---- geo: scheme ----
      if (s.startsWith('geo:')) {
        // Examples:
        // geo:29.27,47.95?q=29.27,47.95
        // geo:0,0?q=29.27,47.95(Work)
        const body = s.slice(4); // after "geo:"
        const [beforeQ, afterQ] = body.split('?');

        // Try coordinates before '?'
        const parts = (beforeQ || '').split(',');
        const num = v => {
          const n = parseFloat(v);
          return Number.isFinite(n) ? n : undefined;
        };
        let lat = num(parts[0]);
        let lng = num(parts[1]);
        let address;

        // Also check q=… in the query part
        if (afterQ) {
          // find q=... (don’t rely on URLSearchParams for RN; parse manually)
          const mQ = afterQ.match(/(?:^|[&])q=([^&]+)/i);
          if (mQ) {
            const qRaw = decodeURIComponent(mQ[1] || '');
            address = qRaw;

            // If q contains "lat,lng" pull them out (ignore any "(label)")
            const mCoords = qRaw.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
            if (mCoords) {
              lat = num(mCoords[1]);
              lng = num(mCoords[3]);
            }
          }
        }

        const out = {};
        if (lat != null && lng != null) {
          out.lat = lat;
          out.lng = lng;
        }
        if (address) out.address = address;
        return out;
      }

      // ---- https maps links / map shorteners ----
      const u = new URL(s);
      const qs = u.search || '';
      const dec = v => decodeURIComponent(v || '');
      const getParam = k => {
        const re = new RegExp(`[?&]${k}=([^&]+)`, 'i');
        const m = qs.match(re);
        return m ? dec(m[1]) : undefined;
      };

      // Look at common params
      const keys = ['q', 'query', 'daddr', 'destination', 'll'];
      for (const k of keys) {
        const v = getParam(k);
        if (!v) continue;

        // If the value looks like "lat,lng", parse them
        const m = v.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
        if (m) {
          return {
            lat: parseFloat(m[1]),
            lng: parseFloat(m[3]),
            address: v,
          };
        }
        // Otherwise treat it as an address string
        return {address: v};
      }

      // Also support /@lat,lng in path
      const at = u.pathname.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
      if (at) {
        return {lat: parseFloat(at[1]), lng: parseFloat(at[3])};
      }

      return {};
    } catch (e) {
      return {};
    }
  }

  async function getSnappedLocations(locations) {
    return Promise.all(
      locations?.map(async item => {
        const actualLat = item?.agentlog?.lat;
        const actualLong = item?.agentlog?.long;
        const headingAngle = item?.agentlog?.heading_angle;
        const vehicleType = item?.vehicle_type_id;
        try {
          const url = `https://router.project-osrm.org/nearest/v1/driving/${actualLong},${actualLat}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data?.waypoints?.length > 0) {
            const [snappedLong, snappedLat] = data?.waypoints[0]?.location;
            return {
              lat: snappedLat,
              long: snappedLong,
              headingAngle,
              vehicleType,
              driverid: item?.id,
            };
          }
          return {
            lat: actualLat,
            long: actualLong,
            headingAngle,
            vehicleType,
            driverid: item?.id,
          };
        } catch (err) {
          return {
            lat: actualLat,
            long: actualLong,
            headingAngle,
            vehicleType,
            driverid: item?.id,
          };
        }
      }),
    );
  }

  const renderDriverTypeMarkes = type => {
    switch (type) {
      case 1:
        return imagePath.taxiTopView;
        break;
      case 2:
        return imagePath.comfortTopView;
        break;
      case 3:
        return imagePath.truckTopView;
        break;
      case 4:
        return imagePath.towTopView;
        break;
      default:
        return imagePath.taxiTopView;
        break;
    }
  };

  useEffect(() => {
    if (!!userData?.auth_token) {
      getAllAddress();
    }
  }, [del]);

  useFocusEffect(
    React.useCallback(() => {
      if (!!userData?.auth_token) {
        getAllAddress();
      }
    }, []),
  );

  const getAllAddress = () => {
    actions
      .getAddress(
        {},
        {
          code: appData?.profile?.code,
        },
      )
      .then(res => {
        updateState({
          allSavedAddress: res.data,
          isLoading: false,
          indicator: false,
        });
      })
      .catch(error => {
        updateState({isLoading: false});
        showError(error?.message || error?.error);
      });
  };

  const continueWithNaxtScreen = (item, gender, captainNational) => {
    onPressCategory({
      ...item,
      driverType: gender,
      captainNational: captainNational,
    });
  };


  const addUpdateLocation = childData => {
    //setModalVisible(false);
    updateState({isLoading: true});

    actions
      .addAddress(childData, {
        code: appData?.profile?.code,
      })
      .then(res => {
        console.log(res, 'res>res>res');
        updateState({del: del ? false : true});
        showSuccess(res.message);
        updateState({isLoading: false});
        setModalVisible(false);
      })
      .catch(error => {
        updateState({isLoading: false});
        showError(error?.message || error?.error);
      });
  };

  const openCloseMapAddress = type => {
    updateState({selectViaMap: type == 1 ? true : false});
  };

  const setModalVisible = (visible, type, id, data) => {
    updateState({selectViaMap: false});
    if (!!userData?.auth_token) {
      updateState({
        updateData: data,
        isVisible1: visible,
        type: type,
        selectedId: id,
      });
    } else {
      showError(strings.UNAUTHORIZED_MESSAGE);
    }
  };

  /********************************** instant booking funcationality module code starts here *****************************/

  /********************************** get list of vichales based on the vendor and category *********************/

  /********************** instunt order place api code written here ************************/

  const _onInstuntOrderPlace = () => {
    const vendorIdForInstuntBooking =
      appData?.profile?.preferences?.pick_drop_instant_booking_vendor?.id;
    const productIdForIstuntBooking =
      appData?.profile?.preferences?.pick_drop_instant_booking_vendor
        ?.products[0]?.id;
    const locationForOrder = [
      {
        ...currentLocation,
        pre_address: currentLocation?.address,
        task_type_id: 1,
      },
    ];
    const productSKu =
      appData?.profile?.preferences?.pick_drop_instant_booking_vendor
        ?.products[0]?.sku;

    let data = {};
    data['task_type'] = 'now';
    data['schedule_time'] = '';
    data['is_one_push_booking'] = 1;
    data['recipient_phone'] = '';
    data['recipient_email'] = '';
    data['task_description'] = '';
    data['amount'] = 0;
    data['tags_amount'] = 0;
    data['tollamount'] = 0;
    data['servicechargeamount'] = 0;
    data['payment_option_id'] = 1;
    data['vendor_id'] = vendorIdForInstuntBooking;
    data['product_id'] = productIdForIstuntBooking;
    data['currency_id'] = currencies?.primary_currency?.id;
    data['tasks'] = locationForOrder;
    data['images_array'] = [];
    data['user_product_order_form'] = [];
    data['is_postpay'] = '';
    data['order_time_zone'] = RNLocalize.getTimeZone();
    data['bookingType'] = '';
    data['friendName'] = '';

    actions
      .placeDelievryOrder(data, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(res => {
        console.log('res+++++++', res);
        if (res && res?.status == 200) {
          let extraData = {
            orderId: res?.data?.id,
            fromVendorApp: true,
            selectedVendor: {id: vendorIdForInstuntBooking},
            orderDetail: res?.data,
            fromCab: true,
            pickup_taxi: navigationStrings.HOME,
            totalDuration: 0,
            selectedCarOption: productSKu,
          };
          navigation.navigate(
            navigationStrings.PICKUPTAXIORDERDETAILS,
            extraData,
          );
        }
        showSuccess(res?.message);
      })
      .catch(errorMethod);
  };

  const errorMethod = error => {
    console.log(error, 'errorOccured');
    showError(error?.message || error?.error || error?.description);
  };
  const _renderItem = useCallback(
    ({item}) => {
      return (
        <TaxiHomeCategoryCard
          data={item}
          onPress={() =>
            continueWithNaxtScreen(item, selectedGender, selectedDriverType)
          }
          mainViewStyle={{color: colors.transparent, width: moderateScale(86)}}
        />
      );
    },
    [appMainData?.categories, isDarkMode, selectedGender, selectedDriverType],
  );

  const moveToScreen = (details, mapView) => {
    updateState({fullMapShow: false});
    if (!mapView) {
      if (!!userData?.auth_token) {
        let prefillAdress = null;
        if (!!details) {
          prefillAdress = {
            longitude: Number(details?.longitude),
            latitude: Number(details?.latitude),
            address: details?.address,
            task_type_id: 1,
            pre_address: details?.address,
            isFromSavedAddress: true,
          };
        }
        actions.saveSchduleTime('now');
        goToAddress({prefillAdress});
      } else {
        actions.setAppSessionData('on_login');
      }
      return;
    }
    setTimeout(() => {
      if (!!userData?.auth_token) {
        let prefillAdress = null;
        if (!!details) {
          prefillAdress = {
            longitude: Number(details?.longitude),
            latitude: Number(details?.latitude),
            address: details?.address,
            task_type_id: 1,
            pre_address: details?.address,
            isFromSavedAddress: true,
          };
        }
        actions.saveSchduleTime('now');
        goToAddress({prefillAdress});
      } else {
        actions.setAppSessionData('on_login');
      }
    }, 800);
  };

  const addressView = image => {
    return (
      !!allSavedAddress &&
      allSavedAddress.map((itm, inx) => {
        return (
          <ScrollView
            key={String(inx)}
            keyboardShouldPersistTaps={'handled'}
            style={{width: width}}>
            <TouchableOpacity
              key={inx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                justifyContent: 'space-between',
                marginLeft: moderateScale(20),
                width: width - 60,
              }}
              onPress={() => moveToScreen(itm, false)}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  marginRight: 20,
                  width: width - 70,
                }}>
                <View>
                  <Image source={image} />
                </View>
                <View
                  style={{
                    marginHorizontal: moderateScale(10),
                  }}>
                  {!!itm?.street ? (
                    <Text
                      numberOfLines={2}
                      style={{
                        ...styles.addressTitle,
                        color: isDarkMode
                          ? MyDarkTheme.colors.text
                          : colors.black,
                      }}>
                      {getBundleId() == appIds.pave
                        ? !!itm?.house_number
                          ? itm?.house_number + ' '
                          : ''
                        : ''}
                      {itm?.street}
                    </Text>
                  ) : null}
                  <Text
                    numberOfLines={2}
                    style={{
                      ...styles.address,
                      color: isDarkMode
                        ? MyDarkTheme.colors.text
                        : colors.black,
                    }}>
                    {itm?.address}
                  </Text>
                </View>
              </View>
              <Image
                style={{
                  tintColor: colors.textGreyLight,
                  marginRight: moderateScale(20),
                }}
                source={imagePath.goRight}
              />
            </TouchableOpacity>
            <View
              style={{
                backgroundColor: getColorCodeWithOpactiyNumber(
                  colors.textGreyLight.substr(1),
                  40,
                ),
                width: width / 1.2,
                marginLeft: moderateScale(60),
                height: 0.5,
              }}></View>
          </ScrollView>
        );
      })
    );
  };

  const goToTutorial = item => {
    let text = '';
    switch (item) {
      case 0:
        text = 'english';
        break;
      case 1:
        text = 'arabic';
        break;
      case 2:
        text = 'hindi';
        break;
      case 3:
        text = 'filipino';
        break;

      default:
        text = 'english';
    }
    setshowTutorialModal(false);
    actions
      .getTutorialVideo(
        `?language=${text}`,
        {},
        {
          code: appData?.profile?.code,
        },
      )
      .then(res => {
        setTimeout(() => {
          if (res?.data?.length > 0) {
            navigation.navigate(navigationStrings.WEBVIEWSCREEN, {
              url: res?.data[0]?.video_file,
            });
          } else {
            showSuccess('Unavailable');
          }
        }, 400);
      })
      .catch(err => console.log(err, 'fdifudufufdh'));
  };

  const savedPlaceView1 = image => {
    return (
      <ScrollView keyboardShouldPersistTaps={'handled'} style={{width: width}}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            justifyContent: 'space-between',
            marginLeft: moderateScale(20),
            width: width - 20,
          }}
          onPress={() => {
            actions.saveSchduleTime('now');
            // let navCatergories = appMainData?.homePageLabels.find((item) => {
            //   if (item?.slug == 'nav_categories') {
            //   return  item
            //   }
            // })
            userData?.auth_token
              ? navigation.navigate(navigationStrings.ADDADDRESS, {
                  data: !!appMainData?.categories
                    ? appMainData?.categories[0]
                    : myCategories[0]?.data[0],
                })
              : actions.setAppSessionData('on_login');
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
            }}>
            <View>
              <Image source={image} />
            </View>
            <View style={{marginHorizontal: moderateScale(10)}}>
              <Text
                numberOfLines={2}
                style={{
                  ...styles.addressTitle,
                  color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
                }}>
                {strings.CHOOSESAVEDPLACE}
              </Text>
            </View>
          </View>
          <Image
            style={{
              tintColor: colors.textGreyLight,
              marginRight: moderateScale(20),
            }}
            source={imagePath.goRight}
          />
        </TouchableOpacity>
        <View
          style={{
            backgroundColor: getColorCodeWithOpactiyNumber(
              colors.textGreyLight.substr(1),
              40,
            ),
            height: moderateScaleVertical(0.6),
            marginHorizontal: moderateScale(20),
            marginVertical: moderateScaleVertical(2),
            borderRadius: 20,
          }}
        />
      </ScrollView>
    );
  };

  const goToAddress = ({
    fromMap = false,
    scheduleDate = null,
    prefillAdress = null,
    newItem = false,
  }) => {
    let item = !!appMainData?.categories
      ? appMainData?.categories[0]
      : myCategories[0]?.data[0];
    console.log(item, 'dishjhsihifsh');
    actions.saveSchduleTime(!!scheduleDate ? scheduleDate : 'now');
    if (fromMap) {
      updateState({fullMapShow: false});
      setTimeout(() => {
        userData?.auth_token
          ? navigation.navigate(navigationStrings.ADDADDRESS, {
              item,
              prefillAdress: !!prefillAdress ? prefillAdress : null,
            })
          : actions.setAppSessionData('on_login');
      }, 800);
    } else {
      userData?.auth_token
        ? navigation.navigate(navigationStrings.ADDADDRESS, {
            item: newItem
              ? {
                  icon: {
                    icon: '96c184/category/icon/TnesOpds5idm7GHNgYN4OtgvQSDZL5vteSvfgJ5v.png',
                    image_fit: 'https://images.cabjak.com/insecure/fit/',
                    image_path:
                      '/sm/0/plain/https://cabjak-prod-s3.s3.me-central-1.amazonaws.com/96c184/category/icon/TnesOpds5idm7GHNgYN4OtgvQSDZL5vteSvfgJ5v.png@webp',
                    proxy_url: 'https://images.cabjak.com/insecure/fill/',
                  },
                  id: 14,
                  image: {
                    image:
                      'category/image/PseJtNMJV8I2m5dFFO5BFPJcBYT5g7jwhqfiUihh.png',
                    image_fit: 'https://images.cabjak.com/insecure/fit/',
                    image_path:
                      '/sm/0/plain/https://cabjak-prod-s3.s3.me-central-1.amazonaws.com/category/image/PseJtNMJV8I2m5dFFO5BFPJcBYT5g7jwhqfiUihh.png@webp',
                    is_original: true,
                    proxy_url: 'https://images.cabjak.com/insecure/fill/',
                  },
                  name: 'Taxi',
                  parent_id: 1,
                  products_count: 2,
                  redirect_to: 'Pickup/Delivery',
                  slug: 'cabservice4',
                  template_type_id: null,
                  type_id: 7,
                  warning_page_id: null,
                }
              : item,
            prefillAdress: !!prefillAdress ? prefillAdress : null,
          })
        : actions.setAppSessionData('on_login');
    }
  };

  const onDateSet = date => {
    updateState({
      isVisible: false,
      isLoadingModal: true,
    });
    setTimeout(() => {
      updateState({isLoadingModal: false});
      goToAddress({scheduleDate: date});
    }, 2000);
  };

  return (
    <WrapperContainer
      style={{
        flex: 1,
        backgroundColor: isDarkMode
          ? MyDarkTheme.colors.background
          : colors.white,
      }}
      // isLoading={isLoading}
    >
      <ScrollView
        // bounces={false}
        refreshing={isRefreshing}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.primary_color}
          />
        }
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          zIndex: 1000,
          backgroundColor: isDarkMode
            ? MyDarkTheme.colors.background
            : colors.white,
        }}>
        <View
          style={{height: width * 0.48, marginTop: moderateScaleVertical(8)}}>
          <TaxiBannerHome
            appStyle={appStyle}
            bannerRef={bannerRef}
            slider1ActiveSlide={slider1ActiveSlide}
            bannerData={
              I18nManager.isRTL
                ? [...appData?.mobile_banners].reverse()
                : [...appData?.mobile_banners]
            }
            sliderWidth={width}
            itemWidth={width}
            onSnapToItem={index => updateState({slider1ActiveSlide: index})}
            cardViewStyle={{}}
            // onPress={(item) => bannerPress(item)}
          />
          {fetchVideoLanguage?.length > 0 ? (
            <TouchableOpacity
              style={{
                position: 'absolute',
                bottom: moderateScaleVertical(10),
                right: moderateScale(12),
                backgroundColor: '#c93247',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                elevation: 3,
              }}
              onPress={() => setshowTutorialModal(true)}>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 14,
                }}>
                ▶ {strings.TUTORIAL}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {!isEmpty(myCategories[0]?.data) ? (
          <FlatList
            horizontal={true}
            alwaysBounceHorizontal={false}
            data={myCategories[0]?.data || []}
            style={{
              marginTop: moderateScaleVertical(2),
            }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'space-between',
              paddingHorizontal: moderateScale(12),
            }}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) =>
              !!item?.id ? String(item.id) : String(index)
            }
            renderItem={_renderItem}
          />
        ) : categoryLoader ? (
          <View
            style={{
              marginTop: moderateScaleVertical(22),
              marginBottom:
                Platform.OS === 'ios'
                  ? moderateScaleVertical(15)
                  : moderateScaleVertical(10),
            }}>
            <CategoryLoader2 />
          </View>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: moderateScale(16),
            marginTop: moderateScaleVertical(2),
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity
            onPress={showActionSheetDriverType}
            style={{width: '49%'}}>
            <View
              style={{
                backgroundColor: getColorCodeWithOpactiyNumber(
                  colors.taxiCategoryGrayColor.substr(1),
                  30,
                ),
                borderRadius: moderateScale(30),
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: moderateScale(8),
                height: moderateScaleVertical(40),
              }}>
              <Image
                style={{
                  transform: [{rotate: '90deg'}],
                  height: moderateScaleVertical(8),
                  width: moderateScale(8),
                  resizeMode: 'contain',
                  tintColor: colors.black,
                  marginLeft: moderateScale(4),
                }}
                source={imagePath.goRight}
              />

              <View style={{}}>
                <Text
                  style={{
                    color: colors.black,
                    fontFamily: fontFamily.medium,
                    fontSize: textScale(11),
                    marginLeft: moderateScale(14),
                  }}>
                  {selectedDriverType === null
                    ? strings.CAPTAINNATIONALITY
                    : selectedDriverType}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={showActionSheetGender}
            style={{width: '49%'}}>
            <View
              style={{
                backgroundColor: getColorCodeWithOpactiyNumber(
                  colors.taxiCategoryGrayColor.substr(1),
                  30,
                ),
                // height: moderateScaleVertical(30),
                borderRadius: moderateScale(30),
                justifyContent: 'space-around',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: moderateScale(8),
                height: moderateScaleVertical(40),
              }}>
              <Image
                style={{
                  transform: [{rotate: '90deg'}],
                  height: moderateScaleVertical(8),
                  width: moderateScale(8),
                  resizeMode: 'contain',
                  tintColor: colors.black,
                }}
                source={imagePath.goRight}
              />

              <View style={{flex: 0.7, alignItems: 'center'}}>
                <Text
                  style={{
                    color: colors.black,
                    fontFamily: fontFamily.medium,
                    fontSize: textScale(11),
                    left: selectedGender === null ? 0 : moderateScale(4),
                  }}>
                  {selectedGender === null
                    ? strings.CAPTAINGENDER
                    : strings.CAPTAIN +
                      '  ' +
                      (selectedGender === 'Male'
                        ? strings.MALE
                        : selectedGender === 'Female'
                        ? strings.FEMALE
                        : selectedGender === 'All'
                        ? strings.ALL
                        : selectedGender)}
                  {/* {selectedGender === 'male' ? 'Male' :selectedGender === 'female' ? 'Female' : 'All'} */}
                </Text>
              </View>

              <View style={{flex: 0.25, alignItems: 'center'}}>
                {selectedGender === null || selectedGender === 'All' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginLeft: moderateScale(4),
                    }}>
                    <Image
                      style={{
                        width: moderateScale(26),
                        height: moderateScale(26),
                        resizeMode: 'contain',
                      }}
                      source={imagePath.femaleGender}
                    />
                    <Image
                      style={{
                        width: moderateScale(26),
                        height: moderateScale(26),
                        resizeMode: 'contain',
                        right: moderateScale(4),
                        bottom: moderateScaleVertical(1),
                      }}
                      source={imagePath.maleGender}
                    />
                  </View>
                ) : (
                  <Image
                    style={{
                      width: moderateScale(30),
                      height: moderateScale(30),
                      left: moderateScale(4),
                    }}
                    source={
                      selectedGender === 'Female'
                        ? imagePath.femaleGender
                        : imagePath.maleGender
                    }
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View
          style={{
            alignItems: 'center',
            marginHorizontal: moderateScale(20),
            marginBottom: moderateScaleVertical(8),
            // backgroundColor: 'red'
          }}>
          {addressView(imagePath.locationRoundedBackground)}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              // paddingVertical: 10,
              justifyContent: 'space-between',
              marginLeft: moderateScale(20),
              width: width - 20,
              marginTop: moderateScaleVertical(12),
            }}
            onPress={() => {
              userData?.auth_token
                ? setModalVisible(true, 'addAddress')
                : actions.setAppSessionData('on_login');
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: moderateScaleVertical(6),
              }}>
              <View>
                <Image source={imagePath.plushRoundedBackground} />
              </View>
              <View style={{marginHorizontal: moderateScale(10)}}>
                <Text
                  numberOfLines={2}
                  style={{
                    ...styles.addressTitle,
                    color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
                  }}>
                  {strings.ADD_NEW_ADDRESS}
                </Text>
              </View>
            </View>
            <Image
              style={{
                tintColor: colors.textGreyLight,
                marginRight: moderateScale(20),
              }}
              source={imagePath.goRight}
            />
          </TouchableOpacity>
          {allSavedAddress.length > 0
            ? null
            : savedPlaceView1(imagePath.starRoundedBackground)}
        </View>
        {Number(liveWalletAmount) <= Number(completeData?.appData?.profile?.preferences?.user_wallet_limit) ? (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate(navigationStrings.ADD_MONEY, {
                pendingDue: liveWalletAmount,
              });
            }}
            activeOpacity={0.8}
            style={{
              marginVertical: moderateScaleVertical(10),
              backgroundColor: colors.redFireBrick,
              padding: moderateScale(12),
              borderRadius: 6,
              // position: 'absolute',
              // top: height / 2,
              alignSelf: 'center',
              marginHorizontal: moderateScale(12),
              zIndex: 2,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={{width: '90%', alignItems: 'flex-start'}}>
                <Text
                  style={{
                    color: colors.white,
                    fontSize: textScale(14),
                    fontFamily: fontFamily.semiBold,
                  }}>
                  {strings.ACTION1}
                </Text>
                <Text
                  style={{
                    color: colors.white,
                    fontSize: textScale(11.8),
                    fontFamily: fontFamily.medium,
                    marginTop: moderateScaleVertical(8),
                    lineHeight: moderateScaleVertical(20),
                  }}>
                  {strings.ACTION2}
                </Text>
              </View>
              <Image
                style={{tintColor: colors.white}}
                source={imagePath.arrowrightt}
              />
            </View>
          </TouchableOpacity>
        ) : null}
        <View style={{marginHorizontal: moderateScale(20)}}>
          <Text
            style={{
              fontSize: textScale(14),
              fontFamily: fontFamily.medium,
              color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
              marginVertical: moderateScaleVertical(4),
            }}>
            {strings.AROUNDYOU}
          </Text>
          <Pressable
            style={{
              height: height / 4,
              width: width - 45,
              borderRadius: 12,
              marginTop: moderateScaleVertical(10),
              alignItems: 'center',
            }}
            onPress={() => updateState({fullMapShow: true})}>
            <MapView
              pointerEvents="none"
              ref={mapRef}
              customMapStyle={blueMapStyle}
              provider={
                Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
              }
              style={{
                ...StyleSheet.absoluteFillObject,
              }}
              initialCamera={{
                center: {
                  latitude: !!currentLocation?.latitude
                    ? parseFloat(currentLocation?.latitude)
                    : !!location?.latitude
                    ? parseFloat(location?.latitude)
                    : 29.3867,
                  longitude: !!currentLocation?.longitude
                    ? parseFloat(currentLocation?.longitude)
                    : !!location?.latitude
                    ? parseFloat(location?.latitude)
                    : 47.9921,
                },
                pitch: 54, // Gives a 3D effect
                heading: 0,
                altitude: 1000,
                zoom: 17,
              }}
              rotateEnabled={false}
              showsBuildings={true}
              showsUserLocation={true}
              showsCompass={false}
              showsMyLocationButton={true}>
              {onRoadDrivers?.map((coordinate, index) => {
                return (
                  <MapCarMark
                    coordinates={coordinate}
                    index={index}
                    imagepath={renderDriverTypeMarkes(coordinate?.vehicleType)}
                    driverid={coordinate?.driverid}
                  />
                );
              })}
              {currentLocation?.latitude ? (
                <Marker
                  coordinate={{
                    latitude: !!currentLocation?.latitude
                      ? parseFloat(currentLocation?.latitude)
                      : 29.3117,
                    longitude: !!currentLocation?.longitude
                      ? parseFloat(currentLocation?.longitude)
                      : 47.4818,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                  }}
                />
              ) : null}
            </MapView>
          </Pressable>

          {!!userData?.auth_token &&
            !!appData?.profile?.preferences?.is_one_push_book_enable &&
            !!appData?.profile?.preferences?.pick_drop_instant_booking_vendor
              ?.id && (
              <GradientButton
                containerStyle={{
                  marginHorizontal: moderateScale(10),
                  marginTop: moderateScaleVertical(20),
                }}
                btnText={'Instant Now'}
                onPress={_onInstuntOrderPlace}
              />
            )}
        </View>

        <View>
          <DatePicker
            theme="light"
            modal
            open={isVisible}
            date={date}
            locale={
              languages?.primary_language?.sort_code
                ? languages?.primary_language?.sort_code
                : 'en'
            }
            mode="datetime"
            textColor={isDarkMode ? colors.black : colors.blackB}
            minimumDate={new Date()}
            style={{
              width: width - 20,
              height: height / 4.4,
            }}
            onConfirm={date => onDateSet(date)}
            onCancel={() => updateState({isVisible: false})}
          />
        </View>
        <View style={{height: moderateScaleVertical(110)}} />
      </ScrollView>
      <AddressModal3
        navigation={navigation}
        updateData={updateData}
        isVisible={isVisible1}
        indicator={indicator}
        onClose={() => setModalVisible(!isVisible1)}
        type={type}
        passLocation={data => addUpdateLocation(data)}
        selectViaMap={selectViaMap}
        openCloseMapAddress={openCloseMapAddress}
        constCurrLoc={{
          latitude: !!currentLocation?.latitude
            ? parseFloat(currentLocation?.latitude)
            : !!location?.latitude
            ? parseFloat(location?.latitude)
            : 29.3867,
          longitude: !!currentLocation?.longitude
            ? parseFloat(currentLocation?.longitude)
            : !!location?.latitude
            ? parseFloat(location?.latitude)
            : 47.9921,
        }}
      />
      {console.log(userData,'disdjsjihidhi')}
      {userData?.gender === 'female' ? (
        <ActionSheet
          ref={actionSheetGender}
          title={strings.SELECTGENDERCAP}
          options={[strings.FEMALE, strings.ALL, strings.CANCEL]}
          cancelButtonIndex={2}
          destructiveButtonIndex={2}
          onPress={index => {
            if (index !== 2) {
              setselectedGender(
                index === 0 ? 'Female' : index === 1 ? 'All' : null,
              );
            }
          }}
        />
      ) : (
        <ActionSheet
          ref={actionSheetGender}
          title={strings.SELECTGENDERCAP}
          options={[strings.MALE, strings.ALL, strings.CANCEL]}
          cancelButtonIndex={2}
          destructiveButtonIndex={2}
          onPress={index => {
            if (index !== 2) {
              setselectedGender(
                index === 0 ? 'Male' : index === 1 ? 'All' : null,
              );
            }
          }}
        />
      )}

      <ActionSheet
        ref={actionSheetDriverType}
        title={strings.SELECTCAPTAINTYPE}
        options={driverTypes}
        cancelButtonIndex={3}
        destructiveButtonIndex={3}
        onPress={index => {
          if (index !== 3) {
            setselectedDriverType(driverTypes[index]);
          }
        }}
      />
      <Modal
        isVisible={fullMapShow}
        style={{
          margin: 0,
        }}
        animationInTiming={600}>
        <View style={{flex: 1}}>
          <View style={{flex: 1}}>
            <MapView
              provider={
                Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
              }
              customMapStyle={blueMapStyle}
              maxZoomLevel={18}
              style={{...StyleSheet.absoluteFillObject}}
              initialCamera={{
                center: {
                  latitude: !!currentLocation?.latitude
                    ? parseFloat(currentLocation?.latitude)
                    : !!location?.latitude
                    ? parseFloat(location?.latitude)
                    : 29.3867,
                  longitude: !!currentLocation?.longitude
                    ? parseFloat(currentLocation?.longitude)
                    : !!location?.latitude
                    ? parseFloat(location?.latitude)
                    : 47.9921,
                },
                pitch: 54, // Gives a 3D effect
                heading: 0,
                altitude: 1000,
                zoom: 18,
              }}
              showsBuildings={true}
              rotateEnabled={false}
              showsIndoors={true}
              showsUserLocation={true}>
              {onRoadDrivers?.map((coordinate, index) => {
                return (
                  <MapCarMark
                    coordinates={coordinate}
                    index={index}
                    imagepath={renderDriverTypeMarkes(coordinate?.vehicleType)}
                    driverid={coordinate?.driverid}
                  />
                );
              })}
              {currentLocation?.latitude ? (
                <Marker
                  coordinate={{
                    latitude: !!currentLocation?.latitude
                      ? parseFloat(currentLocation?.latitude)
                      : 29.3117,
                    longitude: !!currentLocation?.longitude
                      ? parseFloat(currentLocation?.longitude)
                      : 47.4818,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                  }}
                />
              ) : null}
            </MapView>
            <SafeAreaView>
              <TouchableOpacity
                onPress={() => updateState({fullMapShow: false})}
                style={{
                  marginTop: moderateScaleVertical(54),
                  height: moderateScale(40),
                  width: moderateScale(40),
                  borderRadius: moderateScale(16),
                  backgroundColor: colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: moderateScale(20),
                }}>
                <Image
                  style={{
                    tintColor: colors.black,
                  }}
                  source={imagePath.backArrowCourier}
                />
              </TouchableOpacity>
            </SafeAreaView>
          </View>
          <View
            style={{
              height: moderateScale(100),
              backgroundColor: isDarkMode
                ? MyDarkTheme.colors.background
                : colors.white,
            }}>
            <SafeAreaView>
              <TouchableOpacity
                onPress={() => goToAddress({fromMap: true})}
                style={{
                  height: moderateScale(48),
                  backgroundColor: isDarkMode
                    ? colors.whiteOpacity15
                    : colors.greyNew,
                  justifyContent: 'center',
                  paddingHorizontal: moderateScale(16),
                  margin: moderateScale(16),
                  borderRadius: moderateScale(22),
                }}>
                <Text
                  style={{
                    fontFamily: fontFamily.regular,
                    fontSize: textScale(16),
                    textAlign: 'left',
                    color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
                  }}>
                  {strings.WHERETO}
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
      <Modal
        backdropOpacity={0.8}
        isVisible={showTutorialModal}
        style={{
          margin: 0,
        }}
        hasBackdrop={true}
        animationIn={'slideInRight'}
        animationOut={'slideOutRight'}
        onBackButtonPress={() => {
          setshowTutorialModal(false);
        }}
        onBackdropPress={() => {
          setshowTutorialModal(false);
        }}>
        <View style={{}}>
          <FlatList
            bounces={false}
            data={fetchVideoLanguage || []}
            ListHeaderComponent={() => (
              <Text
                style={{
                  fontFamily: fontFamily.medium,
                  fontSize: textScale(13),
                  marginBottom: moderateScaleVertical(20),
                  textAlign: 'center',
                }}>
                {strings.SELECTLANGUAGE}
              </Text>
            )}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderColor: colors.borderColorNew,
                  marginVertical: moderateScaleVertical(14),
                }}
              />
            )}
            contentContainerStyle={{
              backgroundColor: colors.whiteSmokeColor,
              padding: moderateScale(20),
              paddingHorizontal: moderateScaleVertical(30),
              borderRadius: moderateScale(18),
              alignSelf: 'center',
            }}
            renderItem={({item, index}) => (
              <TouchableOpacity
                onPress={() => {
                  goToTutorial(index);
                }}>
                <Text
                  style={{
                    fontFamily: fontFamily.bold,
                    fontSize: textScale(13),
                    textAlign: 'center',
                  }}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </WrapperContainer>
  );
}
