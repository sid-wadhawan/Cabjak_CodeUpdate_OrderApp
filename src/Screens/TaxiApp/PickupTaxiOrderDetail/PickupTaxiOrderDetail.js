import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useIsFocused} from '@react-navigation/native';
import {cloneDeep, isEmpty} from 'lodash';
import moment from 'moment';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  Linking,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Communications from 'react-native-communications';
import {getBundleId} from 'react-native-device-info';
import {useDarkMode} from 'react-native-dynamic';
import FastImage from 'react-native-fast-image';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import MapView, {
  AnimatedRegion,
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps'; // remove PROVIDER_GOOGLE import if not using Google Maps
import MapViewDirections from 'react-native-maps-directions';
import Modal from 'react-native-modal';
import RNFS from 'react-native-fs';
import {useSelector} from 'react-redux';
import WrapperContainer from '../../../Components/WrapperContainer';
import imagePath from '../../../constants/imagePath';
import strings from '../../../constants/lang';
import navigationStrings from '../../../navigation/navigationStrings';
import actions from '../../../redux/actions';
import colors from '../../../styles/colors';
import {MyDarkTheme} from '../../../styles/theme';
import {BarIndicator, BallIndicator} from 'react-native-indicators';

import {
  getCoords,
  getCountryFromCoords,
  getImageUrl,
  hapticEffects,
  playHapticEffect,
  showError,
  showSuccess,
} from '../../../utils/helperFunctions';
import useInterval from '../../../utils/useInterval';
import stylesFunc from './styles';

import StarRating from 'react-native-star-rating';
import ButtonWithLoader from '../../../Components/ButtonWithLoader';
import CustomCallouts from '../../../Components/CustomCallouts';
import LeftRightText from '../../../Components/LeftRightText';
import RoundImg from '../../../Components/RoundImg';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../../styles/responsiveSize';
import {tokenConverterPlusCurrencyNumberFormater} from '../../../utils/commonFunction';
import {appIds} from '../../../utils/constants/DynamicAppKeys';
import {blueMapStyle} from '../../../utils/constants/MapStyle';
import SearchDriver from '../ChooseCarTypeAndTime/SearchDriver';

import {enableFreeze} from 'react-native-screens';
enableFreeze(true);

import 'moment-timezone';
import 'moment/min/locales'; // Import all moment-locales -- it's just 400kb
import GradientButton from '../../../Components/GradientButton';
import BidAcceptRejectCard from '../../../Components/Loaders/BidAcceptRejectCard';
import HeaderLoader from '../../../Components/Loaders/HeaderLoader';
import {Button} from 'react-native-elements';
import {
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';
import AudioRecord from 'react-native-audio-record';
import {saveRecordingState} from '../../../redux/actions/product';

function PickupTaxiOrderDetail({navigation, route}) {
  const {themeColor, themeToggle} = useSelector(state => state?.initBoot);
  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;
  const paramData = route?.params;
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = 0.0922;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
  const CANCLE_TASK_TIME = 180000;
  const theRecorderState = useSelector(state => state.product || {});

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [state, setState] = useState({
    isLoading: true,
    region: {
      latitude: 30.7191,
      longitude: 76.8107,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    },
    coordinate: {},
    tasks: [],
    agent_location: null,
    agent_image: null,
    orderDetail: null,
    showOrderDetailView: false,
    driverStatus: null,
    productInfo: [],
    isShowRating: false,
    getDispatchId: null,
    isVisible: false,
    driverRating: 0,
    orderStatus: '',
    labels: [
      'Accepted',
      'Arrival',
      strings.OUT_FOR_DELIVERY,
      strings.DELIVERED,
    ],
    orderFullDetail: null,
    showModal: false,
    hideShowBack: 0,
    selectedImg: '',
    baseUrl: '',
    isCancleModal: false,
    reason: '',
    isBtnLoader: false,
    cancelError: null,
    isWaitingOver: false,
    submitedRatingToDriver: 0,
    driverRatingData: null,
    orderCancelMessage: '',
  });
  const {
    isLoading,
    region,
    coordinate,
    orderDetail,
    tasks,
    agent_location,
    agent_image,
    showOrderDetailView,
    driverStatus,
    order_vendor_product_id,
    order_id,
    orderRootId,
    productId,
    productInfo,
    isShowRating,
    getDispatchId,
    isVisible,
    driverRating,
    labels,
    orderStatus,
    orderFullDetail,
    showModal,
    hideShowBack,
    selectedImg,
    baseUrl,
    isCancleModal,
    reason,
    isBtnLoader,
    cancelError,
    isWaitingOver,
    submitedRatingToDriver,
    driverRatingData,
    orderCancelMessage,
  } = state;
  const [allDriversList, setAllDriversList] = useState([]);
  const [bidExpiryDuration, setBidExpiryDuration] = useState(0);
  const [bidBookModalVisible, setBidBookModalVisible] = useState(false);
  const [selectedStarRating, setselectedStarRating] = useState();
  const [ratingLoader, setratingLoader] = useState(false);
  const [
    finalCollectionOfLocationsForPickAndDrop,
    setFinalCollectionOfLocationsForPickAndDrop,
  ] = useState([]);
  const [allLocationsLatLongCollection, setAllLocationsLatLongCollection] =
    useState([]);
  const [showLocationUpdateButton, setShowLocationUpdateButton] =
    useState(true);
  const [allDropOffLocationCollection, setAllDropOffLocationCollection] =
    useState([]);
  const [stopSnapping, setstopSnapping] = useState(false);
  const [startMoveVehicle, setstartMoveVehicle] = useState(false);
  const [showreviewtext, setshowreviewtext] = useState(false);
  const [selectedreview, setselectedreview] = useState('');
  const [safetyModal, setsafetyModal] = useState(false);
  const [recordLoader, setrecordLoader] = useState(false);
  const [invoiceModal, setinvoiceModal] = useState(false);

  const [safetyRecordModal, setsafetyRecordModal] = useState(
    theRecorderState?.recordingstatedata?.orderid === paramData?.orderId
      ? !!theRecorderState?.recordingstatedata?.isRecordingLive
      : false,
  );
  const userData = useSelector(state => state?.auth?.userData);
  const updateState = data => setState(state => ({...state, ...data}));
  const {appData, themeColors, currencies, languages, appStyle} = useSelector(
    state => state.initBoot || {},
  );
  const {additional_preferences, digit_after_decimal} =
    appData?.profile?.preferences || {};
  const isFocused = useIsFocused();
  const bottomSheetRef = useRef(null);
  const {profile} = appData || {};
  const fontFamily = appStyle?.fontSizeData;
  const styles = stylesFunc({fontFamily, isDarkMode, MyDarkTheme});
  const mapRef = useRef();
  const [newNearbyDriverRoadLocation, setnewNearbyDriverRoadLocation] =
    useState({});
  useEffect(() => {
    if (paramData?.showLocationUpdateButton) {
      setShowLocationUpdateButton(paramData?.showLocationUpdateButton);
    }
  }, [paramData]);

  const bg = isDarkMode ? colors.whiteOpacity22 : colors.white;
  const border = isDarkMode ? colors.whiteOpacity22 : colors.greyNew;
  const textPrimary = isDarkMode ? MyDarkTheme.colors.text : colors.black;
  const textMuted = isDarkMode ? colors.greyA : colors.textGreyE;
  const primary = themeColors?.primary_color || colors.primary_color;

  const vehicleRef = useRef(
    new AnimatedRegion({
      latitude: parseFloat(newNearbyDriverRoadLocation?.latitude || 0),
      longitude: parseFloat(newNearbyDriverRoadLocation?.longitude || 0),
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    }),
  ).current;

  const urlValue = `/pickup-delivery/order-tracking-details`;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardHeight(event.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      event => {
        setKeyboardHeight(0);
      },
    );
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    deleteRecording();
  }, []);

  useEffect(() => {
    if (!isEmpty(paramData?.orderDropLocations)) {
      _onDropOffLocationChangeData();
    }
  }, [paramData, orderFullDetail?.tasks]);

  const _onDropOffLocationChangeData = () => {
    if (!isEmpty(paramData?.orderDropLocations)) {
      const userPickupLocation = orderFullDetail?.tasks?.filter(
        (item, index) => {
          return item?.task_type_id == 1;
        },
      );

      const userDropLocation = paramData?.orderDropLocations?.filter(
        (item, index) => {
          return item?.task_type_id != 1;
        },
      );

      const newFormatedPickupAddress = userPickupLocation.map((item, index) => {
        return {
          address: item?.address,
          latitude: Number(item?.latitude),
          longitude: Number(item?.longitude),
          pre_address: item?.address,
          task_type_id: item?.task_type_id,
          post_code: item?.post_code,
          short_name: item?.short_name,
          task_status: Number(item?.task_status),
        };
      });
      const newFormatedDropAddress = userDropLocation.map((item, index) => {
        return {
          address: item?.address,
          latitude: Number(item?.latitude),
          longitude: Number(item?.longitude),
          pre_address: item?.address,
          task_type_id: item?.task_type_id,
          post_code: item?.post_code,
          short_name: item?.short_name,
          task_status: Number(item?.task_status),
        };
      });

      const finalCollectionOfLocationsForPickAndDrop = [
        ...newFormatedPickupAddress,
        ...newFormatedDropAddress,
      ];

      const allLocationsLatLongCollection =
        finalCollectionOfLocationsForPickAndDrop.map((item, index) => {
          return {latitude: item?.latitude, longitude: item?.longitude};
        });

      setFinalCollectionOfLocationsForPickAndDrop(
        finalCollectionOfLocationsForPickAndDrop,
      );

      const allDropOffLocationsBeforeProcessing = newFormatedDropAddress.filter(
        (item, index) => {
          return item?.task_status < 2;
        },
      );
      setAllLocationsLatLongCollection(allLocationsLatLongCollection);
      setAllDropOffLocationCollection(allDropOffLocationsBeforeProcessing);
    }
  };

  const deleteRecording = async (fileName = 'recorded.wav') => {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {}
  };

  // useFocusEffect(
  //   React.useCallback(() => {
  //     //   updateState({isLoading: true});
  //     if (!!userData?.auth_token) {
  //       // let url = paramData?.orderDetail?.dispatch_traking_url
  //       //   ? (paramData?.orderDetail?.dispatch_traking_url).replace(
  //       //       '/order/',
  //       //       '/order-details/',
  //       //     )
  //       //   : null;
  //       let url = `/pickup-delivery/order-tracking-details`;

  //       if (url) {
  //         _getOrderDetailScreen(url);
  //       } else {
  //         updateState({ isLoading: false });
  //       }
  //     } else {
  //       showError(strings.UNAUTHORIZED_MESSAGE);
  //     }
  //   }, [currencies, languages, paramData]),
  // );

  useEffect(() => {
    if (urlValue) {
      _updateDriverLocationLocation(urlValue);
    } else {
      updateState({isLoading: false});
    }
  }, [isFocused]);

  useInterval(
    () => {
      if (urlValue) {
        _updateDriverLocationLocation(urlValue);
        _onOrderBidRideDetails();
      } else {
        updateState({isLoading: false});
      }
    },
    isFocused && orderStatus != 'completed' ? 4000 : null,
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, []);

  // *********************************** biding and instant booking funcationality implemented here ***************/

  const _onOrderBidRideDetails = () => {
    const data = {
      order_id: !!paramData?.orderId ? paramData?.orderId : null,
      task_type: 'instant_booking',
    };

    const headerData = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };

    actions
      .orderRideBidDetails(data, headerData)
      .then(res => {
        console.log(res, 'response for bid ride');
        setAllDriversList(res?.data?.biddata);
        setBidExpiryDuration(Number(res?.data?.bid_expire_time_limit_seconds));
        if (!isEmpty(res?.data?.biddata)) {
          setBidBookModalVisible(true);
        } else {
          setBidBookModalVisible(false);
        }
      })
      .catch(error => {
        console.log(error, 'error in this api orderRideBidDetails');
      });
  };

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
        return imagePath.icCar;
        break;
    }
  };

  const _onDeclineRideBid = id => {
    const apiData = {
      bid_id: id,
    };
    const headerData = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };

    console.log(id, headerData, 'decline bif funcation called');
    actions
      .declineRideBid(apiData, headerData)
      .then(res => {
        console.log(res, 'resposen bid decline');
        _onOrderBidRideDetails();
      })
      .catch(error => {
        console.log(error, 'errororororor for bide decline');
      });
  };

  const _onAcceptRideBid = id => {
    const apiData = {
      order_id: !!paramData?.orderId ? paramData?.orderId : null,
      bid_id: id,
      task_type: 'instant_booking',
    };
    const headerData = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };
    actions
      .acceptRideBid(apiData, headerData)
      .then(res => {
        console.log(res, 'resposen bid Accepted');
        _onOrderBidRideDetails();
        setBidBookModalVisible(false);
        _updateDriverLocationLocation(urlValue);
      })
      .catch(error => {
        console.log(error, 'errororororor for bide accept');
      });
  };

  // *********************************** biding and instant booking funcationality Ends here ***************/

  useEffect(() => {
    // console.log('driverStatus', driverStatus);
    if (
      driverStatus != '' &&
      driverStatus != null &&
      driverStatus != undefined
    ) {
      // console.log(driverStatus, 'driverStatus');
      if (orderStatus === 'completed') {
        showSuccess(driverStatus);
        updateState({
          isShowRating: true,
          isVisible: true,
        });
      }
      // showSuccess(driverStatus);
    }
  }, [driverStatus]);

  const new_dispatch_traking_url = !!paramData?.orderDetail
    ?.dispatch_traking_url
    ? (paramData?.orderDetail?.dispatch_traking_url).replace(
        '/order/',
        '/order-details/',
      )
    : null;
  /*********Update driver detail screen********* */
  const _updateDriverLocationLocation = async url => {
    let apiData = {
      order_id: !!paramData?.orderId ? paramData?.orderId : null,
      new_dispatch_traking_url: !!new_dispatch_traking_url
        ? new_dispatch_traking_url
        : null,
    };
    if (!!paramData?.orderId || !!new_dispatch_traking_url) {
      try {
        const res = await actions.getOrderDetailPickUp(apiData, {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        });

        if (!!res?.data) {
          updateState({
            agent_location: res?.data?.agent_location,
            orderDetail: res?.data?.order,
            agent_image: res?.data?.agent_image,
            driverStatus: res?.data?.order_details?.dispatcher_status,
            getDispatchId: res?.data?.order?.id,
            driverRating: res?.data?.avgrating,
            orderStatus: res?.data?.order?.status,
            baseUrl: res?.data?.base_url,
            isLoading: false,
            orderFullDetail: res?.data,
            region: {
              latitude: res?.data?.tasks[0]?.latitude
                ? Number(res?.data?.tasks[0].latitude)
                : 30.7191,
              longitude: res?.data?.tasks[0]?.longitude
                ? Number(res?.data?.tasks[0].longitude)
                : 76.8107,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            },
            coordinate: {
              latitude: res?.data?.tasks[0]?.latitude
                ? Number(res?.data?.tasks[0].latitude)
                : 30.7191,
              longitude: res?.data?.tasks[0]?.longitude
                ? Number(res?.data?.tasks[0].longitude)
                : 76.8107,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            },
            showOrderDetailView: true,
            isShowRating:
              res?.data?.order?.status == 'completed' ? true : false,
            productInfo: res?.data?.order_details?.products,
            tasks: res?.data?.tasks,
          });
          if (res?.data?.order?.status === 'completed') {
            if (
              theRecorderState?.recordingstatedata?.orderid ===
              paramData?.orderId
            ) {
              saveRecordingState({});
              Alert.alert(strings.ALERT, strings.SUBMITAUDIO, [
                {
                  text: strings.SUBMIT,
                  onPress: () => {
                    stopRecording();
                  },
                },
                {
                  text: strings.CANCEL,
                  onPress: () => {
                    AudioRecord.stop();
                    setsafetyRecordModal(false);
                    saveRecordingState({});
                    deleteRecording();
                  },
                },
              ]);
            }
          }
          getNearbyRoadLocation(res?.data?.agent_location);
          let destinationPoint =
            orderFullDetail?.order_details.dispatcher_status_type == 1
              ? orderStatus == 'unassigned'
                ? tasks[tasks.length - 1]
                : tasks[0]
              : tasks[tasks.length - 1];

          let startPoint =
            orderStatus !== 'completed' && orderStatus !== 'unassigned'
              ? {
                  latitude: Number(agent_location?.lat),
                  longitude: Number(
                    agent_location?.long || agent_location?.lng,
                  ),
                }
              : tasks[0];

          // mapRef.current.fitToCoordinates([
          //   {latitude: parseFloat(startPoint?.latitude),
          //     longitude: parseFloat(startPoint?.longitude)},
          //   {
          //     latitude: parseFloat(destinationPoint?.latitude),
          //     longitude: parseFloat(destinationPoint?.longitude)
          //   },
          // ], {
          //   edgePadding: {
          //     right: moderateScale(20),
          //     bottom: height/2,
          //     left: moderateScale(20),
          //     top: moderateScale(40),
          //   },
          // });
        }
      } catch (error) {
        updateState({
          isLoading: false,
          isLoading: false,
          isLoadingC: false,
          isCancleModal: false,
          isBtnLoader: false,
          cancelError: null,
        });
        console.log('error raised', error);
        // showError(error?.message || error?.error);
      }
    }
  };

  console.log(agent_location, 'agent_location');

  useEffect(() => {
    if (!isLoading && orderStatus == 'unassigned') {
      setTimeout(() => {
        updateState({
          isWaitingOver: true,
        });
      }, CANCLE_TASK_TIME);
    }
  }, [isLoading]);

  // /*********Get order detail screen********* */
  // const _getOrderDetailScreen = (url) => {
  //   actions
  //     .getOrderDetailPickUp(
  //       {
  //         order_id: paramData?.orderId,
  //         new_dispatch_traking_url: new_dispatch_traking_url,
  //       },
  //       {
  //         code: appData?.profile?.code,
  //         currency: currencies?.primary_currency?.id,
  //         language: languages?.primary_language?.id,
  //         // systemuser: DeviceInfo.getUniqueId(),
  //       }
  //     )
  //     .then((res) => {
  //       console.log(res, "ressssssss");
  //       // console.log(res, 'agent location2');
  //       // if (JSON.stringify(tasks) !== JSON.stringify(res?.data?.tasks)) {
  //       updateState({
  //         tasks: res?.data?.tasks,
  //       });
  //       // }

  //       updateState({
  //         isLoading: false,
  //         orderFullDetail: res?.data,
  //         baseUrl: res?.data?.base_url,
  //         region: {
  //           latitude: res?.data?.tasks[0]?.latitude
  //             ? Number(res?.data?.tasks[0].latitude)
  //             : 30.7191,
  //           longitude: res?.data?.tasks[0]?.longitude
  //             ? Number(res?.data?.tasks[0].longitude)
  //             : 76.8107,
  //           latitudeDelta: LATITUDE_DELTA,
  //           longitudeDelta: LONGITUDE_DELTA,
  //         },
  //         coordinate: {
  //           latitude: res?.data?.tasks[0]?.latitude
  //             ? Number(res?.data?.tasks[0].latitude)
  //             : 30.7191,
  //           longitude: res?.data?.tasks[0]?.longitude
  //             ? Number(res?.data?.tasks[0].longitude)
  //             : 76.8107,
  //           latitudeDelta: LATITUDE_DELTA,
  //           longitudeDelta: LONGITUDE_DELTA,
  //         },
  //         showOrderDetailView: true,
  //         agent_location: res?.data?.agent_location,
  //         orderDetail: res?.data?.order,
  //         agent_image: res?.data?.agent_image,
  //         driverStatus: res?.data?.order_details?.dispatcher_status,
  //         isShowRating: res?.data?.order?.status == "completed" ? true : false,
  //         productInfo: res?.data?.order_details?.products,
  //       });
  //     })
  //     .catch(errorMethod);
  // };

  const getNearbyRoadLocation = async locations => {
    // const url = `https://roads.googleapis.com/v1/snapToRoads?path=${locations?.lat},${locations?.long}&key=AIzaSyCxC6idqT9U3ktlQ97jcqZKGk5bYSz3uBo`;
    const url = `https://router.project-osrm.org/nearest/v1/driving/${locations?.long},${locations?.lat}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json?.waypoints[0]?.location.length > 0) {
        if (
          json?.waypoints[0]?.location[1] &&
          json?.waypoints[0]?.location[0]
        ) {
          const newCoordinate = {
            latitude: parseFloat(json?.waypoints[0]?.location[1]),
            longitude: parseFloat(json?.waypoints[0]?.location[0]),
          };

          vehicleRef
            .timing({
              ...newCoordinate,
              duration: startMoveVehicle ? 4000 : 10,
              useNativeDriver: false,
            })
            .start();
          setstartMoveVehicle(true);
        }
        setnewNearbyDriverRoadLocation({
          latitude: json?.waypoints[0]?.location[1] || locations?.lat,
          longitude: json?.waypoints[0]?.location[0] || locations?.long,
        });
      }
    } catch (error) {
      console.warn('Snap to road failed:', error);
    }
  };

  const errorMethod = error => {
    updateState({
      isLoading: false,
      isLoading: false,
      isLoadingC: false,
      isCancleModal: false,
      isBtnLoader: false,
      cancelError: null,
    });
    setratingLoader(false);
  };
  const _onRegionChange = region => {
    updateState({region: region});
    // _getAddressBasedOnCoordinates(region);
    // animate(region);
  };

  //   on press call
  const _onPressCall = orderDetail => {
    // alert("123")
    Communications.phonecall(orderDetail?.phone_number, true);
  };

  const _giveRatingToProduct = (productDetail, rating) => {
    let data = {};
    data['order_vendor_product_id'] = productDetail?.id;
    data['order_id'] = productDetail?.order_id;
    data['product_id'] = productDetail?.product_id;
    data['rating'] = rating;
    data['review'] = productDetail?.product_rating?.review
      ? productDetail?.product_rating?.review
      : '';

    actions
      .giveRating(data, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(res => {
        // console.log(res, 'resresresresres');
        let cloned_productInfo = cloneDeep(productInfo);
        // console.log(cloned_productInfo, 'cloned_productInfo');
        console.log(res.data, 'res.data');
        updateState({
          isLoading: false,
          productInfo: cloned_productInfo.map((itm, inx) => {
            if (itm?.product_id == productDetail?.product_id) {
              itm.product_rating = res.data;
              return itm;
            } else {
              return itm;
            }
          }),
        });
      })
      .catch(errorMethod);
  };

  // on press chat
  const _onPressChat = orderDetail => {
    Communications.text(orderDetail?.phone_number);
  };

  const onStarRatingPress = (productData, rating) => {
    _giveRatingToProduct(productData, rating);
  };

  const onStarRatingForDriverPress = () => {
    setratingLoader(true);
    const data = {
      order_id: productInfo[0]?.order_id,
      rating: selectedStarRating
        ? selectedStarRating
        : orderFullDetail?.order_driver_rating?.rating,
      review: !!selectedreview
        ? selectedreview
        : orderFullDetail?.order_driver_rating?.review,
    };
    actions
      .ratingToDriver(data, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(res => {
        setratingLoader(false);
        updateState({
          isLoading: false,
          submitedRatingToDriver: res?.data?.rating,
          driverRatingData: res?.data,
        });
        showSuccess(res?.message);
        if (paramData?.fromCab) {
          setTimeout(() => {
            navigation.popToTop();
          }, 400);
        } else {
          setTimeout(() => {
            navigation.goBack();
            navigation.navigate(navigationStrings.HOMESTACK);
          }, 100);
        }
      })
      .catch(errorMethod);
  };

  const dialCall = (number, type = 'phone') => {
    type === 'phone'
      ? Communications.phonecall(number.toString(), true)
      : Communications.text(number.toString());
  };
  const _modalClose = () => {
    updateState({
      isVisible: false,
    });
  };
  const rateYourOrder = item => {
    updateState({
      isLoading: true,
    });
    _updateDriverLocationLocation()
      .then(res => {
        updateState({
          isVisible: false,
          isLoading: false,
        });
        navigation.navigate(navigationStrings.RATEORDER, {item});
      })
      .catch(error => {
        updateState({
          isVisible: false,
          isLoading: false,
        });
      });
  };

  const viewDriverStatus = () => {
    switch (orderFullDetail?.order.status) {
      case 'completed':
        return strings.COMPLETE;
        break;
      case 'assigned':
        return strings.ASSIGNED;
        break;
      case 'unassigned':
        return strings.UNASSIGNED;
        break;
      case 'arrived':
        return strings.ARRIVED;
        break;
      default:
        break;
    }
  };

  //dropLocationChangeAfterOrderPlace

  const _onDropLocationChangeAfterOrderPlace = () => {
    updateState({
      isLoading: true,
    });

    const apiData = {
      order_number: orderFullDetail?.order?.order_number,
      locations: allLocationsLatLongCollection,
      tasks: finalCollectionOfLocationsForPickAndDrop,
      task_type: orderFullDetail?.scheduled_date_time
        ? orderFullDetail?.scheduled_date_time
        : 'now',
      tasks_dropoff: allDropOffLocationCollection,
    };

    const apiHeader = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };

    actions
      .dropLocationChangeAfterOrderPlace(apiData, apiHeader)
      .then(res => {
        showSuccess(res?.message);
        _updateDriverLocationLocation();
        setShowLocationUpdateButton(false);
      })
      .catch(errorMethod);
  };

  const _ModalMainView = () => {
    // console.log('checking isShowRating', !!isShowRating);
    return (
      <View
        style={{
          // height: height / 5,
          backgroundColor: colors.white,
          alignItems: 'center',
          borderRadius: moderateScale(10),
        }}>
        <TouchableOpacity
          onPress={_modalClose}
          style={{position: 'absolute', right: 0, top: 0}}>
          <Image source={imagePath.cross} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: textScale(16),
            fontFamily: fontFamily?.bold,
            marginTop: moderateScaleVertical(20),
          }}>
          Rate the product
        </Text>
        {!!isShowRating && (
          <ScrollView horizontal>
            {productInfo?.map((item, index) => {
              return (
                <View style={{marginVertical: moderateScaleVertical(20)}}>
                  <View
                    style={{
                      width: moderateScale(width - 50),
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: moderateScale(10),
                    }}>
                    <Image
                      style={{
                        resizeMode: 'contain',
                        height: moderateScale(60),
                        width: moderateScale(60),

                        borderRadius: moderateScale(30),
                      }}
                      source={{
                        uri: getImageUrl(
                          item.image.proxy_url,
                          item.image.image_path,
                          '150/150',
                        ),
                        priority: FastImage.priority.high,
                      }}
                    />

                    <View
                      style={{
                        // marginTop: moderateScaleVertical(-30),
                        marginHorizontal: moderateScale(10),
                      }}>
                      <StarRating
                        disabled={false}
                        maxStars={5}
                        rating={item?.product_rating?.rating}
                        selectedStar={rating => onStarRatingPress(item, rating)}
                        fullStarColor={colors.ORANGE}
                        starSize={30}
                      />
                    </View>
                  </View>
                  <GradientButton
                    colorsArray={[
                      themeColors.primary_color,
                      themeColors.primary_color,
                    ]}
                    textStyle={{
                      textTransform: 'none',
                      fontSize: textScale(16),
                    }}
                    onPress={() => rateYourOrder(item)}
                    marginTop={moderateScaleVertical(10)}
                    marginBottom={moderateScaleVertical(10)}
                    btnText={strings.WRITE_A_REVIEW}
                    btnStyle={{width: '80%'}}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={{marginVertical: moderateScaleVertical(10)}}>
          <Text
            style={{
              fontSize: textScale(16),
              fontFamily: fontFamily?.bold,
              alignSelf: 'center',
            }}>
            Rate the driver
          </Text>
          <View
            style={{
              width: moderateScale(width - 50),
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: moderateScale(20),
            }}>
            <Image
              style={{
                height: moderateScale(60),
                width: moderateScale(60),
                borderRadius: moderateScale(30),
              }}
              source={{
                uri: agent_image,
                priority: FastImage.priority.high,
              }}
            />

            <View
              style={{
                // marginTop: moderateScaleVertical(-30),
                marginHorizontal: moderateScale(10),
              }}>
              <StarRating
                disabled={false}
                maxStars={5}
                rating={1}
                selectedStar={rating => onStarRatingForDriverPress(rating)}
                fullStarColor={colors.ORANGE}
                starSize={30}
              />
            </View>
          </View>
          <View>
            <GradientButton
              colorsArray={[
                themeColors.primary_color,
                themeColors.primary_color,
              ]}
              textStyle={{
                textTransform: 'none',
                fontSize: textScale(16),
              }}
              onPress={() =>
                rateYourOrder({
                  order_id: productInfo[0]?.order_id,
                  isDriverRate: true,
                })
              }
              marginTop={moderateScaleVertical(10)}
              marginBottom={moderateScaleVertical(10)}
              btnText={strings.WRITE_A_REVIEW}
              btnStyle={{width: '80%'}}
            />
          </View>
        </View>
      </View>
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
      return (
        granted['android.permission.RECORD_AUDIO'] ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    }

    if (Platform.OS === 'ios') {
      const status = await request(PERMISSIONS.IOS.MICROPHONE);

      if (status !== RESULTS.GRANTED) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in Settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => openSettings()},
          ],
        );
      }

      return status === RESULTS.GRANTED;
    }

    return false;
  };

  const startinRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }
    if (!!theRecorderState?.recordingstatedata?.isRecordingLive) {
      alert('Recording already in another ride');
      return;
    }
    try {
      const options = {
        sampleRate: 22050,
        channels: 1,
        bitsPerSample: 16,
        wavFile: 'recorded.wav',
      };
      setsafetyRecordModal(true);
      AudioRecord.init(options);
      AudioRecord.start(),
        saveRecordingState({
          isRecordingLive: true,
          orderid: paramData?.orderId,
        });
      sendRecordNotification();
    } catch (errr) {
      AudioRecord.stop();
      setsafetyRecordModal(false);
      saveRecordingState({});
    }
  };

  const sendRecordNotification = () => {
    try {
      actions
        .sendRecorderNotification(
          {
            order_number: orderFullDetail?.order?.order_number
              ? orderFullDetail?.order?.order_number
              : paramData?.orderDetail?.order_number,
          },
          {
            code: appData?.profile?.code,
            currency: currencies?.primary_currency?.id,
            language: languages?.primary_language?.id,
          },
        )
        .then(res => {
          console.log(res, 'dsjdjdisisdjsdj');
        })
        .catch(err => {
          console.log(err, 'djdijiads');
        });
    } catch {}
  };

  const stopRecording = async (autoStop = false) => {
    const audioFile = await AudioRecord.stop();
    saveRecordingState({});
    uploadAudioFile(audioFile);
  };

  const uploadAudioFile = async audioPath => {
    setrecordLoader(true);
    let formdata = new FormData();
    formdata.append('audio', {
      uri: 'file://' + audioPath,
      type: 'audio/wav',
      name: 'recording.wav',
    });

    const apiHeader = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
      'content-Type': 'multipart/form-data',
    };
    actions
      .uploadTempAudio(formdata, apiHeader)
      .then(res => {
        if (res?.status === 200) {
          actions
            .sendAudioReport(
              {
                order_id: !!paramData?.orderId ? paramData?.orderId : null,
                audio_link: res?.audio_url,
              },
              {
                code: appData?.profile?.code,
                currency: currencies?.primary_currency?.id,
                language: languages?.primary_language?.id,
              },
            )
            .then(res => {
              console.log(res, 'fsudadyyadsgy');
              setrecordLoader(false);
              setsafetyModal(false);
              setsafetyRecordModal(false);
              showSuccess(strings.DONE);
              deleteRecording();
            })
            .catch(error => {
              setsafetyModal(false);
              setsafetyRecordModal(false);
              setrecordLoader(false);
              showError('Failed');
            });
        }
      })
      .catch(error => {
        setsafetyModal(false);
        setsafetyRecordModal(false);
        setrecordLoader(false);

        showError('Failed');
      });
  };

  //order detail View
  // const _selectOrderDetailView = () => {
  //   return (
  //     <TaxiOrderDetailView
  //       // orderDetail={orderDetail}
  //       isLoading={isLoading}
  //       // agent_image={agent_image}
  //       // agent_location={agent_location}
  //       // productDetail={paramData?.orderDetail}
  //       onPressCall={(orderDetail) => _onPressCall(orderDetail)}
  //       onPressChat={(orderDetail) => _onPressChat(orderDetail)}
  //     />
  //   );
  // };

  // const _selectTexiOrderDetailView = () => {
  //   return (
  //     <SearchingForDriverView
  //       orderDetail={orderDetail}
  //       isLoading={isLoading}
  //       agent_image={agent_image}
  //       agent_location={agent_location}
  //       productDetail={paramData?.orderDetail}
  //       onPressCall={(orderDetail) => _onPressCall(orderDetail)}
  //       onPressChat={(orderDetail) => _onPressChat(orderDetail)}
  //       totalDuration={paramData?.totalDuration}
  //       selectedCarOption={paramData?.selectedCarOption}
  //       productRatings={productInfo}
  //       isShowRating={isShowRating}
  //       navigation={navigation}
  //       onStarRatingPress={onStarRatingPress}
  //       driverRating={driverRating}
  //     />
  //   );
  // };

  const offset = useRef(new Animated.Value(0)).current;

  const bottomSheetHeader = () => {
    if (!!orderFullDetail) {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: moderateScale(42),
            justifyContent: 'space-between',
            backgroundColor: isDarkMode
              ? MyDarkTheme.colors.background
              : colors.white,
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              style={{
                tintColor: isDarkMode ? MyDarkTheme.colors.text : colors.black,
                opacity: 0,
              }}
              source={imagePath.backArrowCourier}
            />
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: isDarkMode
                ? colors.whiteOpacity77
                : colors.black,
              width: moderateScale(40),
              height: moderateScale(4),
              marginRight: moderateScale(34),
            }}
          />
          <Text />
        </View>
      );
    } else {
      return <View />;
    }
  };

  const onCenter = () => {
    let cords = orderFullDetail.tasks.map(val => {
      return {
        latitude: Number(val?.latitude),
        longitude: Number(val?.longitude),
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
    }, []);
    mapRef.current.fitToCoordinates(cords, {
      edgePadding: {
        right: moderateScale(20),
        bottom: moderateScale(40),
        left: moderateScale(20),
        top: moderateScale(40),
      },
    });
  };

  const hideModal = () => {
    updateState({
      isCancleModal: false,
      cancelError: null,
      orderCancelMessage: '',
      reason: '',
    });
  };

  const onCancelOrder = reasonForCancle => {
    if (reason == '' && !reasonForCancle) {
      updateState({
        cancelError:
          strings.PLEASE_ENTER +
          strings.CANCELLATION_REASON.toLocaleLowerCase(),
      });
      // alert(
      //   `${
      //     strings.PLEASE_ENTER
      //   }${strings.CANCELLATION_REASON.toLocaleLowerCase()}`,
      // );
      return;
    }

    updateState({isBtnLoader: true, cancelError: null});

    const apiData = {
      order_id: paramData?.orderId,
      vendor_id: paramData?.selectedVendor?.id,
      reject_reason: !!reasonForCancle ? reasonForCancle : reason,
    };
    actions
      .cancelOrder(apiData, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(response => {
        if (response?.status == 403) {
          updateState({
            orderCancelMessage: response?.message,
            cancelError: null,
          });
        } else {
          updateState({
            isCancleModal: false,
            cancelError: null,
          });
          showSuccess(response?.message);
          setTimeout(() => {
            updateState({
              isBtnLoader: false,
            });
          }, 1000);
          {
            paramData?.keyValue
              ? navigation.goBack()
              : navigation.navigate(navigationStrings.HOMESTACK);
          }
        }
      })
      .catch(errorMethod);
  };

  console.log(paramData, 'paramData>>');

  let subscription_percent =
    (orderFullDetail?.order_details?.order_detail?.subscription_discount /
      orderFullDetail?.order_details?.order_detail?.total_amount) *
    100;

  const onWhatsapp = async () => {
    const link = `https://api.whatsapp.com/send?phone=${orderFullDetail?.order?.phone_number.replace(
      '+',
      '',
    )}`;
    if (link) {
      Linking.canOpenURL(link)
        .then(supported => {
          if (!supported) {
            Alert.alert('Please install Whatsapp to send direct message.');
          } else {
            return Linking.openURL(link);
          }
        })
        .catch(err => console.error('An error occurred', err));
    } else {
      console.log('sendWhatsAppMessage -----> ', 'message link is undefined');
    }
  };

  const onChat = item => {
    navigation.navigate(navigationStrings.CHAT_SCREEN, {data: {...item}});
  };

  // Instan Booking and bid and ride
  const renderDriverListCard = ({item, index}) => {
    return (
      <BidAcceptRejectCard
        data={item}
        bidExpiryDuration={bidExpiryDuration}
        _onDeclineBid={_onDeclineRideBid}
        _onAcceptRideBid={_onAcceptRideBid}
      />
    );
  };

  const createRoom = async (item, type) => {
    try {
      const apiData = {
        sub_domain: '192.168.101.88', //this is static value
        client_id: String(appData?.profile.id),
        db_name: appData?.profile?.database_name,
        user_id: String(userData?.id),
        type: type,
        order_vendor_id: String(item?.id),
        vendor_id: String(item?.vendor_id),
        order_id: String(item?.order_id),
      };
      if (type == 'agent_to_user') {
        apiData.agent_id = orderFullDetail?.agent_location?.agent_id;
        apiData.agent_db = orderFullDetail?.agent_dbname;
      }
      updateState({isLoading: true});

      console.log('sending api data room created', orderFullDetail);
      const res = await actions.onStartChat(apiData, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      });
      console.log('start chat res', res);
      updateState({isLoading: false});
      if (!!res?.roomData) {
        onChat(res.roomData);
      }
    } catch (error) {
      console.log('error raised in start chat api', error);
      showError(error?.message);
      updateState({isLoading: false});
    }
  };

  const invoiceDetails = data => {
    // console.log(data?.order, 'disdijdsijdidj');

    return (
      <View style={styles.invoiceCard}>
        <Text style={styles.invoiceTitle}>{strings.INVOICE_DETAILS}</Text>

        {!!Number(orderFullDetail?.order_details?.subtotal_amount) ? (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>{strings.ESTIMATED_PRICE}</Text>
            <Text style={styles.invoiceValue}>
              {` ${tokenConverterPlusCurrencyNumberFormater(
                Number(orderFullDetail?.order_details?.subtotal_amount),
                2,
                additional_preferences,
                currencies?.primary_currency?.symbol,
              )}`}
            </Text>
          </View>
        ) : null}
        {/* {!!Number(orderFullDetail?.order_details?.taxable_amount) ? (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>{strings.TAX_AMOUNT}</Text>
            <Text style={styles.invoiceValue}>
              {`${tokenConverterPlusCurrencyNumberFormater(
                Number(orderFullDetail?.order_details?.taxable_amount),
                2,
                additional_preferences,
                currencies?.primary_currency?.symbol,
              )}`}
            </Text>
          </View>
        ) : null} */}

        <View style={styles.invoiceDivider} />

        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceTotalLabel}>{strings.TOTAL}</Text>
          <Text style={styles.invoiceTotal}>
            {`${tokenConverterPlusCurrencyNumberFormater(
              Number(orderFullDetail?.order_details?.payable_amount),
              2,
              additional_preferences,
              currencies?.primary_currency?.symbol,
            )}`}
          </Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>{strings.PAYMENTMETHOD}</Text>
          <Text style={styles.invoiceValue}>
            {paramData?.orderDetail.payment_option_title || 'Cash'}
          </Text>
        </View>
      </View>
    );
  };

  const NewInvoiceDesign = () => {
    return (
      <View
        style={{
          // flex: 1,
          marginTop: moderateScaleVertical(10),
          backgroundColor: colors.white,
          borderWidth: moderateScale(0.8),
          borderColor: colors.greyColor4,
        }}>
        <View
          style={{
            // backgroundColor: '#fff',
            padding: moderateScale(24),
            borderRadius: moderateScale(2),
            // shadowColor: '#000',
            // shadowOpacity: 0.08,
            // shadowRadius: 14,
            // shadowOffset: {width: 0, height: 4},
            // elevation: 4,
          }}>
          {/* <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Image
              style={{
                width: moderateScale(120),
                height: moderateScaleVertical(50),
                resizeMode: 'contain',
                right: moderateScale(10),
              }}
              source={imagePath.cabjakLogo}
            />
            <View style={{alignItems: 'flex-end'}}>
              <Text
                style={{
                  fontSize: textScale(11),
                  color: '#777',
                }}>
                {strings.ORDER} ID :{' '}
                {orderFullDetail?.order?.order_number
                  ? orderFullDetail?.order?.order_number
                  : paramData?.orderDetail?.order_number}
              </Text>
              <Text
                style={{
                  fontSize: textScale(11),
                  color: '#777',
                }}>
                {moment(orderFullDetail?.order_details?.created_at).format(
                  'MMMM D, YYYY hh:mm a',
                )}
              </Text>
            </View>
          </View> */}
          <Text
            style={{
              fontSize: textScale(17),
              fontWeight: '600',
              alignSelf: 'center',
            }}>
            {`*** ${strings.TRIPRECEIPT} ***`}
          </Text>
          <View
            style={{
              height: moderateScaleVertical(0.6),
              borderStyle: 'dashed',
              // backgroundColor: '#e6e6e6',
              marginVertical: moderateScaleVertical(14),
              borderWidth: moderateScale(0.6),
            }}
          />
          <Text
            style={{
              fontSize: textScale(12),
              color: colors.black,
              marginVertical: moderateScaleVertical(4),
            }}>
            {strings.ORDERID} :{' '}
            {orderFullDetail?.order?.order_number
              ? orderFullDetail?.order?.order_number
              : paramData?.orderDetail?.order_number}
          </Text>
          <Text
            style={{
              fontSize: textScale(12),
              color: colors.black,
              marginVertical: moderateScaleVertical(6),
              alignSelf: 'flex-start',
            }}>
            {moment(orderFullDetail?.order_details?.created_at).format(
              'MMMM D, YYYY hh:mm a',
            )}
          </Text>
          <View
            style={{
              height: moderateScaleVertical(0.6),
              borderStyle: 'dashed',
              // backgroundColor: '#e6e6e6',
              marginVertical: moderateScaleVertical(13),
              borderWidth: moderateScale(0.6),
            }}
          />
          <View style={{height: moderateScaleVertical(10)}} />
          {/* Fare Breakdown */}
          {!!Number(orderFullDetail?.order_details?.subtotal_amount) ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: moderateScaleVertical(4),
              }}>
              <Text
                style={{
                  fontSize: textScale(12),
                  color: colors.black,
                }}>
                {strings.TRIPFARE}
              </Text>
              <Text
                style={{
                  fontSize: textScale(12),
                  color: colors.black,
                }}>
                {` ${tokenConverterPlusCurrencyNumberFormater(
                  Number(orderFullDetail?.order_details?.subtotal_amount),
                  2,
                  additional_preferences,
                  currencies?.primary_currency?.symbol,
                )}`}
              </Text>
            </View>
          ) : null}
          {/* <View
            style={{
              height: 1,
              backgroundColor: '#e6e6e6',
              marginVertical: moderateScaleVertical(10),
            }}
          /> */}
          <View
            style={{
              height: moderateScaleVertical(0.6),
              borderStyle: 'dashed',
              // backgroundColor: '#e6e6e6',
              marginVertical: moderateScaleVertical(13),
              borderWidth: moderateScale(0.6),
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: moderateScaleVertical(6),
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: textScale(15),
                fontWeight: '600',
                color: colors.black,
              }}>
              {strings.TOTAL}
            </Text>
            <Text
              style={{
                fontSize: textScale(14),
                fontWeight: '600',
                color: colors.black,
              }}>
              {`${tokenConverterPlusCurrencyNumberFormater(
                Number(orderFullDetail?.order_details?.payable_amount),
                2,
                additional_preferences,
                currencies?.primary_currency?.symbol,
              )}`}
            </Text>
          </View>
          <View
            style={{
              height: moderateScaleVertical(0.6),
              borderStyle: 'dashed',
              // backgroundColor: '#e6e6e6',
              marginVertical: moderateScaleVertical(16),
              borderWidth: moderateScale(0.6),
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: moderateScaleVertical(6),
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: textScale(15),
                fontWeight: '600',
                color: colors.black,
              }}>
              {strings.PAYMENT_METHOD}
            </Text>
            <Text
              style={{
                fontSize: textScale(15),
                fontWeight: '600',
                color: colors.black,
              }}>
              {paramData?.orderDetail.payment_option_title ===
              'Cash On Delivery'
                ? strings.CASHH
                : paramData?.orderDetail.payment_option_title || 'Cash'}
            </Text>
          </View>
          <View
            style={{
              height: moderateScaleVertical(0.6),
              borderStyle: 'dashed',
              // backgroundColor: '#e6e6e6',
              marginVertical: moderateScaleVertical(20),
              borderWidth: moderateScale(0.6),
            }}
          />
          <Text
            style={{
              fontSize: textScale(16),
              fontWeight: '600',
              alignSelf: 'center',
            }}>
            {strings.THANKYOU}
          </Text>
        </View>
      </View>
    );
  };

  // Driver Details (Redesigned)

  const DriverDetailsCard = () => {
    const driverName = orderFullDetail?.order?.name || 'Driver';
    const phone = orderFullDetail?.order?.phone_number;

    // NEW: car info (use whatever keys you have)
    const carBrand = orderFullDetail?.agent?.vehicle_company;
    const carModel = orderFullDetail?.agent?.plate_number;
    const carImage = orderFullDetail?.agent?.vehicle_image || '';

    const rating =
      orderFullDetail?.avgrating > 0
        ? Number(orderFullDetail?.avgrating).toFixed(1)
        : '';

    return (
      <View
        style={{
          marginVertical: moderateScaleVertical(18),
          marginHorizontal: moderateScale(16),
          borderRadius: moderateScale(14),
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          padding: moderateScale(14),
          shadowColor: colors.black,
          shadowOpacity: isDarkMode ? 0 : 0.08,
          shadowRadius: 10,
          shadowOffset: {width: 0, height: 6},
          elevation: isDarkMode ? 0 : 3,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: moderateScaleVertical(10),
          }}>
          <Text
            style={{
              fontFamily: fontFamily.bold,
              fontSize: textScale(13),
              color: textPrimary,
              marginBottom: moderateScaleVertical(6),
              marginLeft: moderateScale(4),
            }}>
            {strings.DRIVER_DETAILS}
          </Text>
        </View>

        {/* Driver Row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: moderateScale(6),
          }}>
          <RoundImg
            img={orderFullDetail?.agent_image}
            size={moderateScale(60)}
          />

          <View style={{flex: 1, marginLeft: moderateScale(12)}}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fontFamily.regular,
                fontSize: textScale(13),
                color: textPrimary,
                textAlign: 'left',
              }}>
              {driverName}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: moderateScaleVertical(6),
              }}>
              {!!rating && (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <StarRating
                    disabled
                    maxStars={5}
                    rating={Number(rating)}
                    fullStarColor={colors.themeRed}
                    starSize={moderateScale(15)}
                    animation="none"
                    starStyle={{marginRight: moderateScale(3)}}
                  />
                  <Text
                    style={{
                      marginLeft: moderateScale(6),
                      fontFamily: fontFamily.medium,
                      fontSize: textScale(12),
                      color: textMuted,
                    }}>
                    {rating}
                  </Text>
                </View>
              )}

              {/* Optional small status chip (remove if you don’t need) */}
              <View
                style={{
                  marginLeft: moderateScale(10),
                  paddingHorizontal: moderateScale(10),
                  paddingVertical: moderateScaleVertical(4),
                  borderRadius: moderateScale(999),
                  backgroundColor: isDarkMode
                    ? colors.whiteOpacity22
                    : colors.greyNew,
                }}>
                <Text
                  style={{
                    fontFamily: fontFamily.medium,
                    fontSize: textScale(11),
                    color: textMuted,
                  }}>
                  {orderStatus === 'completed' ? 'Trip Completed' : 'On Trip'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Car Row (NEW) */}
        <View
          style={{
            marginTop: moderateScaleVertical(14),
            borderRadius: moderateScale(12),
            padding: moderateScale(8),
            backgroundColor: isDarkMode
              ? colors.whiteOpacity22
              : colors.greyNew,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          {/* Car Image Placeholder */}
          <View
            style={{
              height: moderateScale(62),
              width: moderateScale(62),
              borderRadius: moderateScale(100),
              overflow: 'hidden',
              backgroundColor: isDarkMode
                ? colors.whiteOpacity22
                : colors.white,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDarkMode ? colors.whiteOpacity22 : colors.greyA,
            }}>
            {carImage ? (
              <Image
                source={{uri: carImage}}
                style={{height: '100%', width: '100%'}}
                resizeMode="contain"
              />
            ) : (
              <Text style={{color: textMuted, fontSize: textScale(10)}}>
                Car
              </Text>
            )}
          </View>

          <View style={{flex: 1, marginLeft: moderateScale(12)}}>
            {!!carBrand ? (
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: textScale(11.6),
                  color: textPrimary,
                }}>
                {strings.VEHICLE}
                {':  '}
                {carBrand}
              </Text>
            ) : (
              <></>
            )}

            {!!carModel ? (
              <Text
                numberOfLines={1}
                style={{
                  marginTop: moderateScaleVertical(2),
                  fontFamily: fontFamily.medium,
                  fontSize: textScale(11.6),
                  color: textMuted,
                }}>
                {strings.PLNUMBER}
                {':  '}
                {carModel}
              </Text>
            ) : (
              <></>
            )}
          </View>
        </View>

        {/* Actions */}
        {!!phone && orderStatus !== 'completed' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: moderateScaleVertical(14),
            }}>
            {[
              {icon: imagePath.newWhatsapp, onPress: onWhatsapp, tint: null},
              {
                icon: imagePath.call2,
                onPress: () => dialCall(phone, 'phone'),
                tint: primary,
              },
              {
                icon: imagePath.msg,
                onPress: () => dialCall(phone, 'text'),
                tint: primary,
              },
            ].map((btn, idx) => (
              <TouchableOpacity
                key={String(idx)}
                activeOpacity={0.85}
                onPress={btn.onPress}
                style={{
                  flex: 1,
                  marginHorizontal: moderateScale(6),
                  height: moderateScaleVertical(46),
                  borderRadius: moderateScale(12),
                  backgroundColor: isDarkMode
                    ? colors.whiteOpacity22
                    : colors.white,
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? colors.whiteOpacity22
                    : colors.greyA,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={btn.icon}
                  style={{
                    height: moderateScale(22),
                    width: moderateScale(22),
                    tintColor: idx === 0 ? null : '#606060',
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {orderStatus == 'completed' && (
          <View
            style={{
              width: width / 2.5,
              alignSelf: 'center',
              marginTop: moderateScaleVertical(20),
            }}>
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: textScale(13),
                color: colors.themeRed,
                bottom: moderateScaleVertical(10),
                marginLeft: moderateScale(4),
                alignSelf: 'flex-start',
              }}>
              {orderFullDetail?.order_driver_rating?.rating === undefined
                ? strings.HOWWASRIDE
                : strings.THANKSFORRATING}
            </Text>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <StarRating
                maxStars={5}
                disabled={
                  orderFullDetail?.order_driver_rating?.rating === undefined
                    ? false
                    : true
                }
                rating={
                  selectedStarRating
                    ? selectedStarRating
                    : orderFullDetail?.order_driver_rating?.rating
                }
                selectedStar={rating => setselectedStarRating(rating)}
                fullStarColor={colors.ORANGE}
                starSize={moderateScale(28)}
                animation="tada"
                starStyle={{marginRight: moderateScale(2)}}
              />
              {orderFullDetail?.order_driver_rating?.rating === undefined ? (
                <TouchableOpacity
                  onPress={() => {
                    if (paramData?.fromCab) {
                      setTimeout(() => {
                        navigation.popToTop();
                      }, 500);
                    } else {
                      setTimeout(() => {
                        navigation.goBack();
                        navigation.navigate(navigationStrings.HOMESTACK);
                      }, 100);
                    }
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily.bold,
                      marginLeft: moderateScale(14),
                      color: themeColors.primary_color,
                      fontSize: textScale(13),
                    }}>
                    {strings.SKIP}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {!!selectedreview ? (
              <Text
                style={{
                  fontFamily: fontFamily.medium,
                  fontSize: textScale(13),
                  color: colors.textGreyE,
                  marginLeft: moderateScale(4),
                  marginTop: moderateScaleVertical(4),
                  alignSelf: 'flex-start',
                }}>
                {selectedreview}
              </Text>
            ) : !!orderFullDetail?.order_driver_rating?.review ? (
              <Text
                style={{
                  fontFamily: fontFamily.medium,
                  fontSize: textScale(13),
                  color: colors.textGreyE,
                  marginLeft: moderateScale(4),
                  marginTop: moderateScaleVertical(4),
                  alignSelf: 'flex-start',
                }}>
                {orderFullDetail?.order_driver_rating?.review}
              </Text>
            ) : null}
            {orderFullDetail?.order_driver_rating?.rating === undefined ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: moderateScaleVertical(2),
                }}>
                {showreviewtext ? (
                  <View
                    style={{
                      backgroundColor: colors.white,
                      borderWidth: moderateScale(1.6),
                      borderRadius: moderateScale(6),
                      borderColor: colors.lightGreyBg,
                      justifyContent: 'center',
                      position: 'absolute',
                      zIndex: 6,
                      alignSelf: 'flex-end',
                      right: moderateScale(-40),
                      bottom: moderateScaleVertical(34),
                    }}>
                    {[
                      strings.EXCELLENT,
                      strings.GOOD,
                      strings.AVERAGE,
                      strings.POOR,
                      strings.VERYBAD,
                      strings.OTHER,
                    ].map(item => {
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            if (item === strings.OTHER) {
                              setshowreviewtext(false);
                              setselectedreview('');
                              rateYourOrder({
                                order_id: productInfo[0]?.order_id,
                                isDriverRate: true,
                                driverRatingData: driverRatingData
                                  ? driverRatingData
                                  : orderFullDetail?.order_driver_rating,
                                trackingUrl:
                                  paramData?.orderDetail?.dispatch_traking_url,
                              });
                            } else {
                              setselectedreview(item);
                              setshowreviewtext(false);
                            }
                          }}
                          style={{padding: moderateScale(10)}}>
                          <Text
                            style={{
                              fontFamily: fontFamily.medium,
                              fontSize: textScale(14),
                            }}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  false
                )}
                <View
                  style={{
                    width: moderateScale(64),
                    height: moderateScaleVertical(40),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  {ratingLoader ? (
                    <ActivityIndicator
                      color={themeColors?.primary_color}
                      size={moderateScale(22)}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedStarRating) {
                          onStarRatingForDriverPress();
                        } else {
                          showError('Please select star rating to submit');
                        }
                      }}>
                      <Text
                        style={{
                          fontSize: textScale(13),
                          fontFamily: fontFamily?.bold,
                          color: themeColors?.primary_color,
                        }}>
                        {strings.SUBMIT}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {isLoading ? (
                  <ActivityIndicator
                    color={themeColors?.primary_color}
                    size={moderateScale(22)}
                  />
                ) : (
                  <TouchableOpacity
                    style={{
                      marginLeft: moderateScale(16),
                      height: moderateScaleVertical(40),
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setshowreviewtext(!showreviewtext);
                      // rateYourOrder({
                      //   order_id: productInfo[0]?.order_id,
                      //   isDriverRate: true,
                      //   driverRatingData: driverRatingData
                      //     ? driverRatingData
                      //     : orderFullDetail?.order_driver_rating,
                      //   trackingUrl:
                      //     paramData?.orderDetail?.dispatch_traking_url,
                      // })
                    }}>
                    <Text
                      style={{
                        alignSelf: 'center',
                        marginVertical: moderateScaleVertical(10),
                        fontSize: textScale(13),
                        fontFamily: fontFamily?.bold,
                        color: themeColors?.primary_color,
                      }}>
                      {strings.WRITE_A_REVIEW}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <WrapperContainer
        bgColor={isDarkMode ? MyDarkTheme.colors.background : colors.white}
        statusBarColor={colors.white}
        isLoadingB={isLoading}>
        <View
          style={{flex: 1, marginVertical: moderateScale(16), marginBottom: 0}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: moderateScaleVertical(16),
              marginHorizontal: moderateScale(16),
            }}>
            <TouchableOpacity
              onPress={() => navigation.popToTop()}
              activeOpacity={0.8}>
              <Image
                style={{
                  tintColor: isDarkMode
                    ? MyDarkTheme.colors.text
                    : colors.black,
                }}
                source={imagePath.backArrowCourier}
              />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: moderateScale(16),
                fontFamily: fontFamily.medium,
                textAlign: 'left',
                marginLeft: moderateScale(8),
                color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
              }}>
              {orderStatus == 'unassigned'
                ? appIds.jiffex == getBundleId()
                  ? strings.YOUR_ORDER_WILL_START_SOON
                  : strings.YOUR_RIDE_WILL_START_SOON
                : strings.INVOICE}
            </Text>
          </View>
          <View>
            <View style={{alignItems: 'center'}}>
              <HeaderLoader
                widthLeft={width}
                rectWidthLeft={width}
                heightLeft={height / 1.75}
                rectHeightLeft={height / 1.75}
                isRight={false}
              />
            </View>

            <View style={{alignSelf: 'center'}}>
              <HeaderLoader
                widthLeft={moderateScale(60)}
                rectWidthLeft={moderateScale(60)}
                heightLeft={moderateScale(8)}
                rectHeightLeft={moderateScale(8)}
                isRight={false}
                viewStyles={{marginTop: moderateScale(10)}}
                rx={0}
                ry={0}
              />
            </View>

            <HeaderLoader
              widthLeft={moderateScale(140)}
              rectWidthLeft={moderateScale(140)}
              heightLeft={moderateScale(10)}
              rectHeightLeft={moderateScale(10)}
              isRight={false}
              viewStyles={{marginTop: moderateScaleVertical(24)}}
              rx={0}
              ry={0}
            />
            <HeaderLoader
              widthLeft={moderateScale(100)}
              rectWidthLeft={moderateScale(100)}
              heightLeft={moderateScale(10)}
              rectHeightLeft={moderateScale(10)}
              isRight={false}
              viewStyles={{marginTop: 10}}
              rx={0}
              ry={0}
            />

            <View style={styles.loaderStyle}>
              <View>
                <HeaderLoader
                  widthLeft={moderateScale(180)}
                  rectWidthLeft={moderateScale(140)}
                  heightLeft={moderateScale(10)}
                  rectHeightLeft={moderateScale(10)}
                  isRight={false}
                  rx={0}
                  ry={0}
                />
                <HeaderLoader
                  widthLeft={moderateScale(100)}
                  rectWidthLeft={moderateScale(100)}
                  heightLeft={moderateScale(10)}
                  rectHeightLeft={moderateScale(10)}
                  isRight={false}
                  viewStyles={{marginTop: 10}}
                  rx={0}
                  ry={0}
                />
              </View>

              <View>
                <HeaderLoader
                  widthLeft={moderateScale(140)}
                  rectWidthLeft={moderateScale(140)}
                  heightLeft={moderateScale(10)}
                  rectHeightLeft={moderateScale(10)}
                  isRight={false}
                  rx={0}
                  ry={0}
                />
                <HeaderLoader
                  widthLeft={moderateScale(100)}
                  rectWidthLeft={moderateScale(100)}
                  heightLeft={moderateScale(10)}
                  rectHeightLeft={moderateScale(10)}
                  isRight={false}
                  viewStyles={{marginTop: 10}}
                  rx={0}
                  ry={0}
                />
              </View>
            </View>
          </View>
        </View>
      </WrapperContainer>
    );
  }

  const orderDetailStatus = () => {
    return (
      <View style={{marginBottom: moderateScaleVertical(16)}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginHorizontal: moderateScale(16),
            alignItems: 'center',
          }}>
          <Text
            style={
              isDarkMode
                ? [styles.orderLableStyle, {color: MyDarkTheme.colors.text}]
                : styles.orderLableStyle
            }>
            {`${strings.ORDER_ID}: #${
              orderFullDetail?.order?.order_number
                ? orderFullDetail?.order?.order_number
                : paramData?.orderDetail?.order_number
            }`}
          </Text>

          {isWaitingOver && orderStatus == 'unassigned' ? (
            <></>
          ) : !!(
              (orderStatus !== 'completed' ||
                orderStatus !== 'started' ||
                orderStatus !== 'arrived') &&
              ((orderFullDetail?.order_details?.dispatcher_status_type == 1 &&
                orderFullDetail?.order_details?.dispatcher_status ===
                  'Your driver has been assigned!') ||
                orderFullDetail?.order_details?.dispatcher_status ===
                  'Hold on! We are looking for drivers nearby!')
            ) ? (
            <TouchableOpacity
              disabled={orderStatus == 'cancelled' || orderStatus == 'failed'}
              activeOpacity={0.7}
              style={{
                backgroundColor: themeColors.primary_color,
                padding: moderateScale(6),
                borderRadius: moderateScale(8),
              }}
              onPress={() => updateState({isCancleModal: true})}>
              <Text
                style={{
                  textAlign: 'right',
                  color: colors.white,
                  fontFamily: fontFamily.regular,
                }}>
                {orderStatus == 'cancelled' || orderStatus == 'failed'
                  ? strings.ORDER_CANCELLED
                  : orderStatus == 'completed'
                  ? null
                  : strings.CANCEL_ORDER}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {orderFullDetail?.ETA || orderFullDetail?.remaining_distance ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: moderateScale(16),
              marginTop: moderateScaleVertical(20),
            }}>
            {orderFullDetail?.ETA ? (
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: textScale(12),
                }}>
                ETA - {orderFullDetail?.ETA} {strings.MINS}
              </Text>
            ) : null}
            {orderFullDetail?.remaining_distance ? (
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: textScale(12),
                }}>
                EDA - {orderFullDetail?.remaining_distance} km
              </Text>
            ) : null}
          </View>
        ) : null}
        <View
          style={{
            paddingHorizontal: moderateScale(20),
            paddingVertical: moderateScaleVertical(10),
          }}>
          {!userData?.is_superadmin ? (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {!!appData?.profile?.socket_url ? (
                <TouchableOpacity
                  onPress={() =>
                    createRoom(orderFullDetail?.order_details, 'vendor_to_user')
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text style={styles.startChatText}>{strings.VENDOR}</Text>
                  <Image
                    resizeMode="contain"
                    style={styles.agentUserIcon}
                    source={imagePath.icVendorChat}
                  />
                  <Text>{'  '}</Text>
                </TouchableOpacity>
              ) : null}
              {orderFullDetail?.order &&
                orderFullDetail?.agent_location?.lat &&
                appData?.profile?.socket_url && (
                  <TouchableOpacity
                    onPress={() =>
                      createRoom(
                        orderFullDetail?.order_details,
                        'agent_to_user',
                      )
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    activeOpacity={0.7}>
                    <Text style={styles.startChatText}>{strings.DRIVER}</Text>
                    <Image
                      resizeMode="contain"
                      style={styles.agentUserIcon}
                      source={imagePath.icUserChat}
                    />
                  </TouchableOpacity>
                )}
            </View>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: moderateScaleVertical(16),
            marginBottom: moderateScaleVertical(8),
            marginHorizontal: moderateScale(16),
          }}>
          <View style={{flex: 0.7}}>
            <Text style={styles.datePriceText}>
              {moment(new Date(orderFullDetail?.order_details?.created_at))
                .locale(languages?.primary_language?.sort_code || 'en')
                .format('MMMM Do YYYY, h:mm a')}
            </Text>
            <Text
              style={{
                ...styles.statusText,
                marginTop: moderateScaleVertical(4),
                textTransform: 'uppercase',
              }}>
              #{orderFullDetail.order.unique_id}
            </Text>
          </View>
          <View
            style={{
              flex: 0.3,
              alignItems: 'flex-end',
            }}>
            {/* <Text style={styles.statusText}>
              {tokenConverterPlusCurrencyNumberFormater(
                Number(orderFullDetail.order_details?.payable_amount),
                digit_after_decimal,
                additional_preferences,
                currencies?.primary_currency?.symbol,
              )}
            </Text> */}
            <Text
              style={{
                ...styles.statusText,
                color: themeColors.primary_color,
                marginTop: moderateScaleVertical(4),
                textTransform: 'capitalize',
              }}>
              {' '}
              {viewDriverStatus()}
            </Text>
          </View>
        </View>

        {!!(orderFullDetail.order_details?.waiting_price > 0) && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',

              marginBottom: moderateScaleVertical(8),
              marginHorizontal: moderateScale(16),
            }}>
            <Text
              style={{
                ...styles.statusText,
                color: colors.black,
                marginTop: moderateScaleVertical(4),
              }}>
              {`${strings.WAITING_TIME} (${orderFullDetail.order_details?.waiting_time} ${strings.MIN}) ${strings.FEE}`}
            </Text>
            <Text style={styles.statusText}>
              {tokenConverterPlusCurrencyNumberFormater(
                Number(orderFullDetail.order_details?.waiting_price),
                digit_after_decimal,
                additional_preferences,
                currencies?.primary_currency?.symbol,
              )}
            </Text>
          </View>
        )}

        {/* {!!orderFullDetail?.order.task_description && (
          <View style={{marginHorizontal: moderateScale(16)}}>
            <Text style={styles.datePriceText}>{strings.DRIVER_DETAILS}:</Text>
            <Text
              style={{
                ...styles.statusText,
                color: isDarkMode
                  ? MyDarkTheme.colors.text
                  : colors.blackOpacity66,
                lineHeight: moderateScale(20),
              }}>
              {orderFullDetail?.order.task_description}{' '}
            </Text>
          </View>
        )} */}
        <View style={styles.horizontalLine} />

        {orderStatus == 'unassigned' && (
          <SearchDriver
            isWaitingOver={isWaitingOver}
            cancleOrder={() => {
              onCancelOrder('No drivers available.');
            }}
            scheduleDate={orderDetail?.scheduled_date_time}
            isBtnLoader={isBtnLoader}
          />
        )}

        {(!isEmpty(paramData?.orderDropLocations)
          ? paramData?.orderDropLocations
          : orderFullDetail?.tasks
        ).map((val, i) => {
          return (
            <View key={String(i)} style={{marginHorizontal: moderateScale(16)}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <View style={{marginRight: moderateScaleVertical(8)}}>
                  <View style={{alignItems: 'center'}}>
                    {i == 0 ? (
                      <View
                        style={{
                          height: moderateScale(10),
                          width: moderateScale(10),
                          borderRadius: 100,
                          backgroundColor: colors.themeColor,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          height: moderateScale(10),
                          width: moderateScale(10),
                          borderRadius: 100,
                          backgroundColor: colors.themeGreen,
                        }}
                      />
                    )}
                  </View>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                  <Text
                    style={{
                      ...styles.statusText,
                      color: isDarkMode
                        ? MyDarkTheme.colors.text
                        : colors.blackOpacity66,
                      flex: 0.9,
                      marginLeft: moderateScale(6),
                      fontSize: textScale(13),
                    }}>
                    {val?.address || ''}
                  </Text>

                  {/* {!!(
                    val?.task_type_id != 1 &&
                    profile?.preferences?.is_order_edit_enable &&
                    Number(val?.task_status) < 2 &&
                    orderStatus != 'completed'
                  ) && (
                    <TouchableOpacity
                      style={{
                        borderColor: themeColors?.primary_color,
                        borderWidth: 0.5,
                        padding: moderateScale(5),
                        paddingHorizontal: moderateScale(10),
                        height: moderateScale(28),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={moveToNewScreen(navigationStrings.LOCATION, {
                        ...paramData,
                        orderDropLocations: !isEmpty(
                          paramData?.orderDropLocations,
                        )
                          ? paramData?.orderDropLocations
                          : orderFullDetail?.tasks,
                        editIndex: i,
                        showLocationUpdateButton: showLocationUpdateButton,
                      })}>
                      <Text
                        style={{
                          fontFamily: fontFamily.regular,
                          fontSize: textScale(11),
                        }}>
                        {'Change'}
                      </Text>
                    </TouchableOpacity>
                  )} */}
                </View>
              </View>
              {orderFullDetail.tasks.length - 1 !== i && (
                <View
                  style={{
                    borderBottomWidth: 0.8,
                    borderBottomColor: isDarkMode
                      ? colors.whiteOpacity22
                      : colors.lightGreyBg,
                    marginVertical: moderateScaleVertical(8),
                    marginHorizontal: 16,
                  }}
                />
              )}
            </View>
          );
        })}

        {!isEmpty(paramData?.orderDropLocations) &&
          showLocationUpdateButton && (
            <ButtonWithLoader
              isLoading={false}
              btnText={'Update Location'}
              btnTextStyle={{color: colors.white}}
              btnStyle={{
                backgroundColor: themeColors?.primary_color,
                borderColor: themeColors?.primary_color,
                width: width / 2,
                alignSelf: 'center',
                height: moderateScaleVertical(40),
              }}
              onPress={_onDropLocationChangeAfterOrderPlace}
            />
          )}
        <View style={{height: moderateScaleVertical(20)}} />
        {!!orderFullDetail?.transaction_id ? (
          <Text
            style={
              isDarkMode
                ? [
                    styles.orderLableStyle,
                    {
                      color: MyDarkTheme.colors.text,
                      marginLeft: moderateScale(16),
                      marginTop: moderateScaleVertical(0),
                      marginBottom: moderateScaleVertical(12),
                      fontSize: textScale(13),
                    },
                  ]
                : [
                    styles.orderLableStyle,
                    {
                      marginLeft: moderateScale(16),
                      marginTop: moderateScaleVertical(0),
                      marginBottom: moderateScaleVertical(12),
                      fontSize: textScale(13),
                    },
                  ]
            }>
            {`${'Transaction ID'}: ${orderFullDetail?.transaction_id}`}
          </Text>
        ) : null}
        {!!orderFullDetail?.noofCopassengers && !!is_cab_pooling ? (
          <View
            style={{
              marginHorizontal: moderateScale(16),
              paddingBottom: moderateScale(10),
            }}>
            <LeftRightText
              leftText={strings.NO_OF_COPASSENGERS}
              rightText={`${orderFullDetail?.noofCopassengers}`}
              isDarkMode={isDarkMode}
              MyDarkTheme={MyDarkTheme}
              marginBottom={0}
            />
          </View>
        ) : null}
        <View style={{marginHorizontal: moderateScale(16)}}>
          {!!orderFullDetail?.order_details?.delivery_fee &&
            Number(orderFullDetail?.order_details?.delivery_fee) !== 0 && (
              <View>
                <LeftRightText
                  leftText={strings.DELIVERYFEE}
                  rightText={` ${tokenConverterPlusCurrencyNumberFormater(
                    Number(orderFullDetail?.order_details?.delivery_fee),
                    digit_after_decimal,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )}`}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
                <View style={styles.horizontalLine} />
              </View>
            )}
          {/* {!!orderFullDetail?.order_details?.subtotal_amount &&
            Number(orderFullDetail?.order_details?.subtotal_amount) !== 0 && (
              <View>
                <LeftRightText
                  leftText={strings.SUBTOTAL}
                  rightText={` ${tokenConverterPlusCurrencyNumberFormater(
                    Number(orderFullDetail?.order_details?.subtotal_amount),
                    digit_after_decimal,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )}`}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
                <View style={styles.horizontalLine} />
              </View>
            )} */}
          {Number(orderFullDetail?.order_details?.toll_amount) > 0 && (
            <View>
              <LeftRightText
                leftText={strings.TOLL_FEE}
                rightText={` ${tokenConverterPlusCurrencyNumberFormater(
                  Number(orderFullDetail?.order_details?.toll_amount),
                  digit_after_decimal,
                  additional_preferences,
                  currencies?.primary_currency?.symbol,
                )}`}
                isDarkMode={isDarkMode}
                MyDarkTheme={MyDarkTheme}
                marginBottom={0}
              />

              <View style={styles.horizontalLine} />
            </View>
          )}

          {/* {!!orderFullDetail?.order_details?.service_fee_percentage_amount &&
            Number(
              orderFullDetail?.order_details?.service_fee_percentage_amount,
            ) !== 0 && (
              <View>
                <LeftRightText
                  leftText={strings.ONLINE_PAYMENT_FEE}
                  rightText={`${tokenConverterPlusCurrencyNumberFormater(
                    Number(
                      orderFullDetail?.order_details
                        ?.service_fee_percentage_amount,
                    ),
                    digit_after_decimal,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )}`}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
                <View style={styles.horizontalLine} />
              </View>
            )} */}

          {!!orderFullDetail?.order_details?.discount_amount &&
            Number(orderFullDetail?.order_details?.discount_amount) !== 0 && (
              <View>
                <LeftRightText
                  leftText={strings.DISCOUNT}
                  rightText={` ${tokenConverterPlusCurrencyNumberFormater(
                    Number(orderFullDetail?.order_details?.discount_amount),
                    digit_after_decimal,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )}`}
                  leftTextStyle={{color: themeColors.primary_color}}
                  rightTextStyle={{color: themeColors.primary_color}}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
                <View style={styles.horizontalLine} />
              </View>
            )}
          {!!orderFullDetail?.order_details?.order_detail
            ?.subscription_discount &&
            Number(
              orderFullDetail?.order_details?.order_detail
                ?.subscription_discount,
            ) !== 0 && (
              <View>
                <LeftRightText
                  leftText={`${
                    strings.SUBSCRIPTION_DISCOUNT
                  } ${'('} ${tokenConverterPlusCurrencyNumberFormater(
                    Number(subscription_percent),
                    digit_after_decimal,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )} ${'%)'}`}
                  rightText={` ${'-'} ${
                    currencies?.primary_currency?.symbol
                  } ${tokenConverterPlusCurrencyNumberFormater(
                    Number(
                      orderFullDetail?.order_details?.order_detail
                        ?.subscription_discount,
                    ),
                    digit_after_decimal,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )} `}
                  leftTextStyle={{color: themeColors.primary_color}}
                  rightTextStyle={{color: themeColors.primary_color}}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
                <View style={styles.horizontalLine} />
              </View>
            )}
          {!!orderFullDetail?.order?.actual_distance &&
            Number(orderFullDetail?.order?.actual_distance) !== 0 && (
              <View style={{marginBottom: moderateScaleVertical(10)}}>
                <LeftRightText
                  leftText={strings.DISTANCE}
                  rightText={
                    Number(orderFullDetail?.order?.actual_distance).toFixed(0) +
                    ' ' +
                    strings.KM
                  }
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
              </View>
            )}
          {!!orderFullDetail?.order?.actual_time &&
            Number(orderFullDetail?.order?.actual_time) !== 0 && (
              <View style={{marginBottom: moderateScaleVertical(10)}}>
                <LeftRightText
                  leftText={strings.TIME}
                  rightText={
                    Number(orderFullDetail?.order?.actual_time).toFixed(0) +
                    ' ' +
                    strings.MINS
                  }
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
              </View>
            )}
          {console.log(orderFullDetail, 'sfuhsuffs')}
          <View style={styles.horizontalLine} />
          {!!orderFullDetail?.order_details?.subtotal_amount &&
            Number(orderFullDetail?.order_details?.subtotal_amount) !== 0 && (
              <View>
                <LeftRightText
                  leftText={strings.ESTIMATED_PRICE}
                  rightText={` ${tokenConverterPlusCurrencyNumberFormater(
                    Number(orderFullDetail?.order_details?.subtotal_amount),
                    2,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )}`}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
              </View>
            )}
          {/* {!!orderFullDetail?.order_details?.taxable_amount &&
            Number(orderFullDetail?.order_details?.taxable_amount) !== 0 && (
              <View style={{marginVertical: moderateScaleVertical(2)}}>
                <LeftRightText
                  leftText={strings.TAX_AMOUNT}
                  rightText={` ${tokenConverterPlusCurrencyNumberFormater(
                    Number(orderFullDetail?.order_details?.taxable_amount),
                    2,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )}`}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                />
              </View>
            )} */}

          {!!orderFullDetail?.order_details?.payable_amount &&
            Number(orderFullDetail?.order_details?.payable_amount) !== 0 && (
              <View>
                <LeftRightText
                  leftText={strings.TOTAL}
                  rightText={` ${tokenConverterPlusCurrencyNumberFormater(
                    Number(orderFullDetail?.order_details?.payable_amount),
                    2,
                    additional_preferences,
                    currencies?.primary_currency?.symbol,
                  )}`}
                  isDarkMode={isDarkMode}
                  MyDarkTheme={MyDarkTheme}
                  marginBottom={0}
                  rightTextStyle={{color: colors.themeRed}}
                  leftTextStyle={{color: colors.themeRed}}
                />
              </View>
            )}
        </View>
        {!!orderFullDetail?.is_postpay_payment ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              alignSelf: 'flex-end',
              marginTop: 8,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              marginRight: moderateScale(10),
            }}>
            {/* <Text
            style={{
              marginRight: 10,
              fontSize: 13,
              fontWeight: '700',
              color: '#111',
            }}>
            KWD {}
          </Text> */}

            <TouchableOpacity
              style={[
                {
                  backgroundColor: colors.themeColor,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 14,
                },
              ]}
              onPress={() => {
                navigation.navigate(navigationStrings.PAYMENT_OPTIONS, {
                  screenName: strings.DETAILS,
                  data: {
                    currentAmount:
                      orderFullDetail?.order_details?.order_detail
                        ?.payable_amount,
                    orderid: orderFullDetail?.order?.order_number,
                  },
                });
              }}
              activeOpacity={0.85}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: textScale(11),
                  fontWeight: '700',
                }}>
                Pay Now
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {!!orderFullDetail?.agent_location ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: moderateScaleVertical(10),
              paddingHorizontal: moderateScale(16),
            }}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setsafetyModal(true)}
              style={{
                // alignSelf: 'stretch',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: moderateScaleVertical(12),
                paddingHorizontal: moderateScale(12),
                borderRadius: moderateScale(14),
                backgroundColor: bg,
                borderWidth: 1,
                borderColor: border,

                shadowColor: colors.black,
                shadowOpacity: isDarkMode ? 0 : 0.08,
                shadowRadius: 12,
                shadowOffset: {width: 0, height: 8},
                elevation: isDarkMode ? 0 : 2,
              }}>
              {/* Left: icon + title */}
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {/* Icon container */}
                {/* <View
                  style={{
                    height: moderateScale(38),
                    width: moderateScale(38),
                    borderRadius: moderateScale(12),
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isDarkMode
                      ? colors.whiteOpacity22
                      : colors.greyNew,
                    borderWidth: 1,
                    borderColor: isDarkMode
                      ? colors.whiteOpacity22
                      : colors.greyA,
                  }}> */}
                <Image
                  source={imagePath.exclamationmark}
                  style={{
                    height: moderateScale(30),
                    width: moderateScale(30),
                    tintColor: colors.themeColor,
                    resizeMode: 'contain',
                  }}
                  resizeMode="contain"
                />
                {/* </View> */}

                <View style={{marginLeft: moderateScale(10)}}>
                  <Text
                    style={{
                      color: textPrimary,
                      fontFamily: fontFamily.medium,
                      fontSize: textScale(13),
                    }}>
                    {strings.SAFETYTOOLS}
                  </Text>

                  {/* Optional subtitle when recording is ON */}
                  {safetyRecordModal ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: moderateScaleVertical(4),
                      }}>
                      <View
                        style={{
                          width: moderateScale(8),
                          height: moderateScale(8),
                          borderRadius: 20,
                          backgroundColor: 'red',
                        }}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          color: textMuted,
                          fontFamily: fontFamily.medium,
                          fontSize: textScale(10),
                          marginLeft: moderateScale(6),
                        }}>
                        Audio recording active
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        marginTop: moderateScaleVertical(4),
                        color: textMuted,
                        fontFamily: fontFamily.medium,
                        fontSize: textScale(10),
                      }}>
                      {strings.EMERGENCYTEXT}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <Button
              titleStyle={{
                fontFamily: fontFamily.bold,
                fontSize: textScale(13),
              }}
              title={strings.INVOICE}
              buttonStyle={{
                backgroundColor: colors.themeGreen,
                borderRadius: moderateScale(6),
                alignSelf: 'flex-end',
                padding: moderateScale(12),
              }}
              onPress={() => {
                setinvoiceModal(true);
              }}
            />
          </View>
        ) : null}

        {!!orderFullDetail?.agent_location ? <DriverDetailsCard /> : null}

        <View style={{height: moderateScaleVertical(40)}} />
      </View>
    );
  };

  const showMapOrNot = () => {
    switch (orderStatus) {
      case 'completed':
        return false;
      case 'failed':
        return false;
      case 'cancelled':
        return false;
      default:
        return true;
    }
  };

  return (
    <WrapperContainer
      bgColor={isDarkMode ? MyDarkTheme.colors.background : colors.white}
      statusBarColor={colors.white}
      isLoadingB={isLoading}
      isLoading={isBtnLoader}>
      <View
        style={{flex: 1, marginVertical: moderateScale(16), marginBottom: 0}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: moderateScaleVertical(16),
            marginHorizontal: moderateScale(16),
          }}>
          <TouchableOpacity
            onPress={() => navigation.popToTop()}
            activeOpacity={0.8}>
            <Image
              style={{
                tintColor: isDarkMode ? MyDarkTheme.colors.text : colors.black,
              }}
              source={imagePath.backArrowCourier}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: moderateScale(16),
              fontFamily: fontFamily.medium,
              textAlign: 'left',
              marginLeft: moderateScale(8),
              color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
            }}>
            {orderStatus == 'unassigned'
              ? appIds.jiffex == getBundleId()
                ? strings.YOUR_ORDER_WILL_START_SOON
                : strings.YOUR_RIDE_WILL_START_SOON
              : strings.ORDER_DETAIL}
          </Text>
        </View>

        <View style={{flex: 1}}>
          {showMapOrNot() ? (
            <View style={{flex: 1}}>
              {!isLoading &&
                !!tasks?.length > 0 &&
                orderStatus !== 'cancelled' && (
                  <View>
                    {orderStatus !== 'failed' ? (
                      <MapView
                        provider={
                          Platform.OS === 'android'
                            ? PROVIDER_GOOGLE
                            : PROVIDER_DEFAULT
                        }
                        maxZoomLevel={18}
                        style={{height: '100%', width: '100%'}}
                        initialRegion={region}
                        rotateEnabled={false}
                        customMapStyle={blueMapStyle}
                        ref={mapRef}
                        showsIndoors={true}>
                        {!!tasks && tasks.length > 0 && (
                          <CustomCallouts data={tasks} />
                        )}
                        {!!agent_location &&
                          !!agent_location?.lat &&
                          orderStatus != 'completed' &&
                          newNearbyDriverRoadLocation?.latitude && (
                            <Marker.Animated
                              flat
                              style={{zIndex: 2}}
                              coordinate={vehicleRef}
                              anchor={{x: 0.5, y: 0.5}}>
                              <View
                                style={{
                                  width: moderateScale(50), // Larger than image
                                  height: moderateScale(50),
                                  alignItems: 'center',
                                  zIndex: 99,
                                  justifyContent: 'center',
                                }}>
                                <Image
                                  source={renderDriverTypeMarkes(
                                    orderFullDetail?.agent?.vehicle_type_id,
                                  )}
                                  style={{
                                    resizeMode: 'contain',
                                    transform: [
                                      {
                                        rotate: `${Number(
                                          agent_location?.heading_angle ?? 0,
                                        )}deg`,
                                      },
                                    ],
                                  }}
                                />
                              </View>
                            </Marker.Animated>
                          )}

                        {!!tasks && tasks.length > 0 ? (
                          <MapViewDirections
                            resetOnChange={false}
                            origin={
                              orderStatus !== 'completed' &&
                              orderStatus !== 'unassigned'
                                ? {
                                    latitude: parseFloat(
                                      newNearbyDriverRoadLocation?.latitude,
                                    ),
                                    longitude: parseFloat(
                                      newNearbyDriverRoadLocation?.longitude,
                                    ),
                                  }
                                : tasks[0]
                            }
                            waypoints={
                              tasks.length > 2 ? tasks.slice(1, -1) : []
                            }
                            destination={
                              orderFullDetail?.order_details
                                .dispatcher_status_type == 1
                                ? orderStatus == 'unassigned'
                                  ? tasks[tasks.length - 1]
                                  : tasks[0]
                                : tasks[tasks.length - 1]
                            }
                            // destination={tasks[tasks.length - 1]}
                            apikey={profile?.preferences?.map_key}
                            strokeWidth={4}
                            strokeColor={colors.black}
                            optimizeWaypoints={true}
                            onStart={params => {}}
                            precision={'high'}
                            timePrecision={'now'}
                            mode={'DRIVING'}
                            onReady={result => {
                              updateState({
                                totalDistance: result.distance.toFixed(2),
                                totalDuration: result.duration.toFixed(2),
                              });
                              if (!stopSnapping) {
                                setstopSnapping(true);
                                mapRef.current.fitToCoordinates(
                                  result.coordinates,
                                  {
                                    edgePadding: {
                                      right: moderateScale(20),
                                      bottom: height / 2,
                                      left: moderateScale(20),
                                      top: moderateScale(40),
                                    },
                                  },
                                );
                              }

                              // if (newNearbyDriverRoadLocation?.latitude) {
                              //   mapRef.current.animateCamera({
                              //     center: {
                              //       latitude:
                              //         Number(
                              //           newNearbyDriverRoadLocation?.latitude,
                              //         ) - 0.001,
                              //       longitude: Number(
                              //         newNearbyDriverRoadLocation?.longitude,
                              //       ),
                              //     },
                              //     zoom: 18,
                              //   });
                              // }
                            }}
                            onError={errorMessage => {
                              //
                            }}
                          />
                        ) : null}
                      </MapView>
                    ) : null}
                  </View>
                )}
            </View>
          ) : null}

          {showMapOrNot() ? (
            <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={[height / 2.3, height]}
              animateOnMount={true}
              onChange={() => playHapticEffect(hapticEffects.impactMedium)}
              handleComponent={bottomSheetHeader}>
              <BottomSheetScrollView
                style={{
                  backgroundColor: isDarkMode
                    ? MyDarkTheme.colors.background
                    : colors.white,
                }}
                showsVerticalScrollIndicator={false}>
                {!!orderFullDetail && orderDetailStatus()}
              </BottomSheetScrollView>
            </BottomSheet>
          ) : (
            <ScrollView>{orderDetailStatus()}</ScrollView>
          )}
        </View>
      </View>

      <Modal
        isVisible={false}
        onBackdropPress={_modalClose}
        animationIn="zoomIn"
        animationOut="zoomOut">
        {_ModalMainView()}
      </Modal>
      <Modal
        isVisible={showModal}
        onBackdropPress={() => updateState({showModal: false})}
        animationIn="zoomIn"
        animationOut="zoomOut">
        <View
          style={{
            backgroundColor: isDarkMode ? colors.whiteOpacity50 : colors.white,
            borderRadius: moderateScale(8),
            overflow: 'hidden',
            // paddingVertical: moderateScale(12)
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: moderateScale(6),
            }}>
            <Text />
            <Text
              style={{
                fontSize: textScale(16),
                color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
                alignSelf: 'center',
                fontFamily: fontFamily.medium,
              }}>
              {strings.PROOF}
            </Text>
            <TouchableOpacity onPress={() => updateState({showModal: false})}>
              <Image source={imagePath.closeButton} />
            </TouchableOpacity>
          </View>
          <Image
            source={{uri: `${baseUrl}/${selectedImg}`}}
            style={{
              width: '100%',
              height: height / 3,
              backgroundColor: isDarkMode
                ? colors.whiteOpacity22
                : colors.blackOpacity10,
              // borderRadius: 8,
            }}
          />
        </View>
      </Modal>
      <Modal
        isVisible={isCancleModal}
        onBackdropPress={hideModal}
        // animationIn="zoomIn"
        // animationOut="zoomOut"
        style={{
          margin: 0,
          justifyContent: 'flex-end',
        }}>
        <View
          style={{
            backgroundColor: isDarkMode
              ? MyDarkTheme.colors.lightDark
              : colors.white,
            borderRadius: moderateScale(8),
            overflow: 'hidden',
            paddingHorizontal: moderateScale(16),
            paddingVertical: moderateScale(12),
            marginBottom:
              Platform.OS == 'ios' ? moderateScale(keyboardHeight) : 0,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text />
            <Text
              style={{
                fontSize: textScale(16),
                color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
                alignSelf: 'center',
                fontFamily: fontFamily.medium,
              }}>
              {strings.CANCELLATION_REASON}
            </Text>
            <TouchableOpacity onPress={hideModal}>
              <Image
                style={isDarkMode && {tintColor: colors.white}}
                source={imagePath.closeButton}
              />
            </TouchableOpacity>
          </View>
          {!!orderCancelMessage && (
            <Text style={{alignSelf: 'center', color: colors.redB}}>
              {orderCancelMessage}
            </Text>
          )}
          {/* {!!reasonError && (
            <Text
              style={{
                fontSize: textScale(12),
                color: colors.redB,
                fontFamily: fontFamily.medium,
                marginTop: moderateScaleVertical(8),
              }}>
              {strings.REQUIRED}*{' '}
            </Text>
          )} */}

          {!!cancelError ? (
            <Text
              style={{
                fontSize: textScale(11),
                fontFamily: fontFamily.medium,
                color: colors.redB,
                marginTop: !!cancelError ? moderateScaleVertical(16) : 0,
                marginBottom: moderateScaleVertical(4),
              }}>
              {cancelError}*
            </Text>
          ) : null}
          <View
            style={{
              // marginVertical: moderateScaleVertical(16),
              backgroundColor: isDarkMode
                ? colors.whiteOpacity15
                : colors.greyNew,
              height: moderateScale(82),
              borderRadius: moderateScale(4),
              paddingHorizontal: moderateScale(8),
              marginTop: !!cancelError ? 0 : moderateScaleVertical(16),
            }}>
            <TextInput
              multiline
              value={reason}
              placeholder={strings.WRITE_YOUR_REASON_HERE}
              onChangeText={val => updateState({reason: val})}
              style={{
                ...styles.reasonText,
                color: isDarkMode ? colors.textGreyB : colors.black,
                textAlignVertical: 'top',
                flex: 1,
              }}
              onSubmitEditing={Keyboard.dismiss}
              placeholderTextColor={
                isDarkMode ? colors.textGreyB : colors.blackOpacity40
              }
            />
          </View>
          <ButtonWithLoader
            isLoading={isBtnLoader}
            btnText={strings.CANCEL}
            btnStyle={{
              backgroundColor: themeColors.primary_color,
              borderWidth: 0,
            }}
            onPress={() => onCancelOrder(false)}
          />
        </View>
      </Modal>
      <Modal
        isVisible={bidBookModalVisible}
        style={{
          justifyContent: 'flex-start',
          paddingTop: moderateScaleVertical(20),
        }}>
        <View style={{width: width, alignSelf: 'center'}}>
          <FlatList
            data={allDriversList}
            renderItem={renderDriverListCard}
            keyExtractor={(item, index) =>
              !!item?.id ? String(item?.id) : String(index)
            }
          />
        </View>
      </Modal>
      <Modal
        backdropOpacity={0.8}
        isVisible={safetyModal}
        style={{
          margin: 0,
        }}
        hasBackdrop={true}
        animationIn={'slideInRight'}
        animationOut={'slideOutRight'}
        // onBackButtonPress={() => {
        //   setshowTutorialModal(false);
        // }}
        // onBackdropPress={() => {
        //   setshowTutorialModal(false);
        // }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.white,
            paddingHorizontal: moderateScale(16),
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: moderateScaleVertical(20),
            }}>
            <TouchableOpacity onPress={() => setsafetyModal(false)}>
              <Image
                style={{width: moderateScale(30), height: moderateScale(30)}}
                source={imagePath.crossCancel}
              />
            </TouchableOpacity>
            <Text
              style={{
                marginLeft: moderateScale(10),
                fontSize: textScale(18),
                fontFamily: fontFamily.medium,
              }}>
              {strings.SAFETYTOOLS}
            </Text>
          </View>
          <View
            style={{
              marginTop: moderateScaleVertical(40),
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: textScale(18),
                fontFamily: fontFamily.medium,
              }}>
              {strings.YOURSAFETY}
            </Text>
            {/* <Text
              style={{
                fontSize: textScale(14),
                fontFamily: fontFamily.regular,
                textAlign: 'center',
                marginHorizontal: moderateScale(40),
                color: colors.blackOpacity70,
                marginVertical: moderateScaleVertical(28),
              }}>
              {strings.USETHISTOOL}
            </Text> */}
            <TouchableOpacity
              onPress={async () => {
                const {latitude, longitude} = await getCoords();
                const countryCode = await getCountryFromCoords(
                  latitude,
                  longitude,
                );
                if (countryCode === 'KW') {
                  dialCall('112');
                } else if (countryCode === 'SA') {
                  dialCall('911');
                }
              }}
              style={{
                alignItems: 'center',
                marginTop: moderateScaleVertical(10),
              }}>
              <Image
                source={imagePath.redEmergency}
                style={{
                  width: moderateScale(180),
                  height: moderateScale(180),
                  resizeMode: 'contain',
                }}
              />
              <Text
                style={{
                  fontSize: textScale(13.4),
                  fontFamily: fontFamily.medium,
                  color: colors.black,
                  bottom: moderateScaleVertical(14),
                }}>
                {strings.EMERGENCYCONTACT}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={safetyRecordModal}
              onPress={() => {
                safetyRecordModal ? null : startinRecording();
              }}
              style={{
                alignItems: 'center',
                marginTop: moderateScaleVertical(10),
              }}>
              <Image
                source={imagePath.greenmic}
                style={{
                  width: moderateScale(170),
                  height: moderateScale(170),
                  resizeMode: 'contain',
                }}
              />
              <Text
                style={{
                  fontSize: textScale(13.4),
                  fontFamily: fontFamily.medium,
                  color: colors.black,
                  bottom: moderateScaleVertical(14),
                }}>
                {strings.RECORDAUDIO}
              </Text>
            </TouchableOpacity>

            {safetyRecordModal ? (
              <View
                style={{
                  width: '85%',
                  // backgroundColor: '#F2F2F2',
                  borderRadius: 20,
                  paddingTop: moderateScaleVertical(24),

                  alignItems: 'center',
                  alignSelf: 'center',

                  // shadowColor: '#000',
                  // shadowOffset: {width: 0, height: 6},
                  // shadowOpacity: 0.1,
                  // shadowRadius: 12,
                  // elevation: 6,
                }}>
                {/* Recording Indicator */}
                {recordLoader ? (
                  <BallIndicator
                    color={colors.blackOpacity66}
                    style={{marginVertical: moderateScaleVertical(45)}}
                  />
                ) : (
                  <>
                    <View
                      style={{
                        width: moderateScale(10),
                        height: moderateScale(10),
                        borderRadius: 20,
                        backgroundColor: 'red',
                        marginBottom: 10,
                      }}
                    />

                    <Text
                      style={{
                        fontSize: textScale(15),
                        fontFamily: fontFamily.bold,
                        color: '#333',
                      }}>
                      {strings.RECORDING}
                    </Text>

                    <BarIndicator
                      size={moderateScale(20)}
                      style={{marginVertical: moderateScale(24)}}
                    />
                  </>
                )}
                {/* Buttons Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: moderateScaleVertical(10),
                  }}>
                  <Button
                    disabled={recordLoader}
                    onPress={() => {
                      stopRecording();
                    }}
                    title={strings.SUBMIT}
                    titleStyle={{
                      fontFamily: fontFamily.medium,
                      fontSize: textScale(14),
                    }}
                    containerStyle={{
                      borderRadius: 8,
                      marginRight: 12,
                    }}
                    buttonStyle={{
                      paddingVertical: moderateScale(10),
                      paddingHorizontal: moderateScale(22),
                      backgroundColor: colors.themeGreen,
                    }}
                  />

                  <Button
                    disabled={recordLoader}
                    onPress={async () => {
                      AudioRecord.stop();
                      setsafetyRecordModal(false);
                      saveRecordingState({});
                      deleteRecording();
                    }}
                    title={strings.CANCEL}
                    titleStyle={{
                      fontFamily: fontFamily.medium,
                      fontSize: textScale(14),
                    }}
                    containerStyle={{
                      borderRadius: 8,
                    }}
                    buttonStyle={{
                      paddingVertical: moderateScale(10),
                      paddingHorizontal: moderateScale(22),
                      backgroundColor: colors.themeRed,
                    }}
                  />
                </View>
              </View>
            ) : null}
            {safetyRecordModal ? (
              <></>
            ) : (
              <View
                style={{
                  marginTop: moderateScaleVertical(10),
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: textScale(18),
                    fontFamily: fontFamily.medium,
                    marginTop: moderateScaleVertical(38),
                  }}>
                  {strings.STAYSAFE}
                </Text>
                <Text
                  style={{
                    fontSize: textScale(14),
                    fontFamily: fontFamily.regular,
                    textAlign: 'center',
                    marginHorizontal: moderateScale(40),
                    color: colors.blackOpacity70,
                    marginVertical: moderateScaleVertical(20),
                  }}>
                  {strings.QUICKLYACCESS}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        backdropOpacity={0.8}
        isVisible={invoiceModal}
        style={{
          margin: 0,
        }}
        hasBackdrop={true}
        animationIn={'slideInRight'}
        animationOut={'slideOutRight'}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(247, 250, 255,1)',
            paddingHorizontal: moderateScale(16),
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: moderateScaleVertical(20),
            }}>
            <TouchableOpacity onPress={() => setinvoiceModal(false)}>
              <Image
                style={{width: moderateScale(30), height: moderateScale(30)}}
                source={imagePath.crossCancel}
              />
            </TouchableOpacity>
            <Text
              style={{
                marginLeft: moderateScale(10),
                fontSize: textScale(18),
                fontFamily: fontFamily.semiBold,
              }}>
              {strings.INVOICE_DETAILS}
            </Text>
          </View>
          <View style={{marginTop: moderateScaleVertical(40)}}>
            <View
              style={{
                marginBottom: moderateScaleVertical(20),
                paddingHorizontal: moderateScale(20),
              }}>
              {/* Pickup */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <View
                  style={[
                    {
                      width: moderateScale(14),
                      height: moderateScale(14),
                      borderRadius: 100,
                      marginRight: 10,
                    },
                    {backgroundColor: colors.themeColor},
                  ]}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: textScale(12),
                    color: colors.black,
                    textAlign: 'left',
                    // fontWeight: '500',
                  }}>
                  {orderFullDetail?.tasks[0]?.address}
                </Text>
              </View>

              {/* Vertical Line */}
              <View
                style={{
                  width: 1.5,
                  height: moderateScaleVertical(30),
                  backgroundColor: '#d0d0d0',
                  marginLeft: moderateScale(6),
                  // marginVertical:moderateScaleVertical(2)
                }}
              />

              {/* Drop */}
              <View
                style={{
                  flexDirection: 'row',
                  // alignItems: 'center',
                }}>
                <View
                  style={[
                    {
                      width: moderateScale(14),
                      height: moderateScale(14),
                      borderRadius: 100,
                      marginRight: 10,
                      top: moderateScaleVertical(4),
                    },
                    {backgroundColor: colors.themeGreen},
                  ]}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: textScale(12),
                    color: colors.black,
                    textAlign: 'left',
                  }}>
                  {orderFullDetail?.tasks[1]?.address}
                </Text>
              </View>
            </View>

            <NewInvoiceDesign />
            {/* {invoiceDetails()} */}
            <Text
              style={{
                fontSize: textScale(13),
                color: colors.textGreyI,
                marginTop: moderateScaleVertical(50),
                alignSelf: 'center',
              }}>
              {strings.WEHOPEYOU}
            </Text>
          </View>
          {/* <View>
            <View
              style={{
                marginTop: moderateScaleVertical(20),
              }}>
              <View style={styles.invoiceCard}>
                <Text style={styles.address} numberOfLines={2}>
                  {orderFullDetail?.tasks[0].address}
                </Text>
              </View>

              <View
                style={{
                  ...styles.invoiceCard,
                  marginTop: moderateScaleVertical(20),
                }}>
                <Text style={styles.address}>
                  {orderFullDetail?.tasks[1].address}
                </Text>
              </View>
              <View style={styles.dotViewStyle}>
               
                {false ? null : (
                  <View
                    style={[
                      styles.statusView,
                    ]}>
                    <Text
                      style={[
                        styles.taskTypeName,
                        {color: colors.white},
                      ]}>
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View> */}
        </View>
      </Modal>
    </WrapperContainer>
  );
}

export default gestureHandlerRootHOC(PickupTaxiOrderDetail);
