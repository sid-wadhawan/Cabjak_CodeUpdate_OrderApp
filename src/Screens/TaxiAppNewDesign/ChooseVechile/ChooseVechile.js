import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import axios from 'axios';
import {PayWithFlutterwave} from 'flutterwave-react-native';
import {isEmpty} from 'lodash';
import moment from 'moment';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import DatePicker from 'react-native-date-picker';
import {getBundleId} from 'react-native-device-info';
import {useDarkMode} from 'react-native-dynamic';
import {BarIndicator, BallIndicator} from 'react-native-indicators';

import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';
import Geocoder from 'react-native-geocoding';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import * as RNLocalize from 'react-native-localize';
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps'; // remove PROVIDER_GOOGLE import if not using Google Maps
import MapViewDirections from 'react-native-maps-directions';
import {
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';
// import RazorpayCheckout from 'react-native-razorpay';
import Sound from 'react-native-sound';
import {useSelector} from 'react-redux';
import BorderTextInputWithLable from '../../../Components/BorderTextInputWithLable';
import BottomViewModal from '../../../Components/BottomViewModal';
import CustomCallouts from '../../../Components/CustomCallouts';
import GradientButton from '../../../Components/GradientButton';
import TextInputWithUnderlineAndLabel from '../../../Components/TextInputWithUnderlineAndLabel';
import imagePath from '../../../constants/imagePath';
import strings from '../../../constants/lang';
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
import {tokenConverterPlusCurrencyNumberFormater} from '../../../utils/commonFunction';
import {appIds} from '../../../utils/constants/DynamicAppKeys';
import {blueMapStyle} from '../../../utils/constants/MapStyle';
import {
  deviceCountryCode,
  getCurrentLocation,
  getImageUrl,
  hapticEffects,
  playHapticEffect,
  showError,
  showSuccess,
} from '../../../utils/helperFunctions';
import {generateTransactionRef} from '../../../utils/paystackMethod';
import {chekLocationPermission} from '../../../utils/permissions';
import useInterval from '../../../utils/useInterval';
import PaymentProcessingModal from '../../CourierService/PaymentProcessingModal';
import SelectPaymentModalView from '../../TaxiApp/ChooseCarTypeAndTime/SelectPaymentModalView';
import AvailableDriver from '../Comps/AvailableDriver';
import stylesFun from './styles';
import MapCarMark from '../../../Components/MapCarMark';
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

function ChooseVechile({navigation, route}) {
  const paramData = route?.params?.promocodeDetail
    ? route?.params?.promocodeDetail
    : route?.params;
  const bottomSheetRef = useRef(null);
  const mapRef = useRef();

  const {
    appData,
    currencies,
    languages,
    themeColors,
    appStyle,
    themeToggle,
    themeColor,
  } = useSelector(state => state?.initBoot || {});
  const {userData} = useSelector(state => state?.auth || {});
  const {pickUpTimeType, location} = useSelector(state => state?.home || {});
  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;
  const {profile} = appData || {};
  const fontFamily = appStyle?.fontSizeData;
  const {
    additional_preferences,
    digit_after_decimal,
    distance_unit_for_time,
    is_bid_ride_enable,
    is_cab_pooling,
  } = appData?.profile?.preferences || {};
  const styles = stylesFun({fontFamily, themeColors});
  const [isVisibleMtnGateway, setIsVisibleMtnGateway] = useState(false);
  const [mtnGatewayResponse, setMtnGatewayResponse] = useState('');
  const [responseTimer, setResponseTimer] = useState(420);
  const [onRoadDrivers, setonRoadDrivers] = useState([]);
  const [pickuporderdetails, setPickuporderdetails] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordedPath, setRecordedPath] = useState('');
  const [useWalletMoney, setuseWalletMoney] = useState(false);
  const [state, setState] = useState({
    region: {
      latitude: paramData?.location[0]?.latitude
        ? Number(paramData?.location[0]?.latitude)
        : 30.7191,
      longitude: paramData?.location[0]?.longitude
        ? Number(paramData?.location[0]?.longitude)
        : 76.8107,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    },
    isLoading: false,
    formattedAddress: '8502 Preston Rd. Inglewood, Maine 98380',
    availableVendors: !isEmpty(paramData?.cabVendors)
      ? paramData?.cabVendors
      : [],
    availableCarList: [],
    selectedCarOption: null,

    showCarModal: true,
    showPaymentModal: false,
    redirectFromNow: false,
    date: new Date(),
    slectedDate: paramData?.datetime?.slectedDate
      ? paramData?.datetime?.slectedDate
      : null,
    selectedTime: paramData?.datetime?.selectedTime
      ? paramData?.datetime?.selectedTime
      : null,

    isModalVisible: false,
    selectedVendorOption: !isEmpty(paramData?.cabVendors)
      ? paramData?.cabVendors[0]
      : null,
    pageNo: 1,
    limit: 12,
    uploadImages: [],
    totalDistance: 0,
    totalDuration: 0,
    updatedAmount: null,
    couponInfo: null,
    loyalityAmount: null,
    pickedUpTime: paramData?.datetime?.selectedTime
      ? paramData?.datetime?.selectedTime
      : null,
    pickedUpDate: paramData?.datetime?.slectedDate
      ? paramData?.datetime?.slectedDate
      : null,
    selectedPayment: {},
    taskInstruction: '',
    allSubmittedAnswers: null,
    indicatorLoader: false,
    defaultDeviceCountryCode: null,
    isScheduleModalVisible: false,
    scheduleDateTime: {},
    myCurrentLocationDetails: {},
    allListedDrivers: [],
    isModalVisibleForPayFlutterWave: false,
    paymentDataFlutterWave: null,
    disableButton: false,
    showBidPriceModal: false,
    uID: '',
  });
  const {
    selectedPayment,
    couponInfo,
    updatedAmount,
    totalDistance,
    totalDuration,
    isModalVisible,
    isLoading,
    region,
    availableCarList,
    selectedCarOption,
    showCarModal,
    showPaymentModal,
    redirectFromNow,
    slectedDate,
    selectedTime,
    selectedVendorOption,
    date,
    availableVendors,
    pageNo,
    limit,
    loyalityAmount,
    pickedUpTime,
    pickedUpDate,
    uploadImages,
    taskInstruction,
    allSubmittedAnswers,
    indicatorLoader,
    defaultDeviceCountryCode,
    isScheduleModalVisible,
    scheduleDateTime,
    myCurrentLocationDetails,
    allListedDrivers,
    isModalVisibleForPayFlutterWave,
    paymentDataFlutterWave,
    disableButton,
    showBidPriceModal,
    uID,
  } = state;

  const updateState = data => setState(state => ({...state, ...data}));
  const [updateSeatNO, setUpdateSeatNo] = useState(1);
  const [showFinalUpdatedSeatNo, setShowFinalUpdatedSeatNo] = useState(1);
  const [bidRidePrice, setBidRidePrice] = useState('0');
  const [bideRequestLoading, setBideRequestLoading] = useState(false);
  const [cabBookingType, setCabBookingType] = useState(
    route?.params?.id == 23 || route?.params?.id == 25 ? 'bidRide' : 'Booking',
  );
  const [bidDescription, setbidDescription] = useState('');
  const [isCabBooking, setIsCabBooking] = useState(false);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
  const [walletAmount, setWalletAmount] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioUploading, setisAudioUploading] = useState(false);
  const soundRef = useRef(null);
  const isFocused = useIsFocused();
  useFocusEffect(
    React.useCallback(() => {
      if (paramData && paramData?.selectedMethod) {
        updateState({selectedPayment: paramData?.selectedMethod});
      }
    }, [paramData]),
  );
  useEffect(() => {
    Geocoder.init(profile?.preferences?.map_key, {language: 'en'}); // set the language
    setTimeout(() => {
      onCenter();
    }, 3000);
  }, []);

  const playSubscriptionRef = useRef(null);

  useEffect(() => {
    stopRecording();
    deleteRecording();
  }, []);

  useInterval(
    () => {
      getAllDrivers();
    },
    isFocused ? 6000 : null,
  );

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

  const deleteRecording = async (fileName = 'recorded.wav') => {
    stopPlayback();
    try {
      if (
        !fileName ||
        typeof fileName !== 'string' ||
        fileName.includes('/') ||
        fileName.includes('\\')
      ) {
        throw new Error('Invalid file name');
      }
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        setRecordedPath(null);
        // soundRef.current.release();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Failed to delete audio file:', error.message || error);
    }
  };

  const startinRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }
    const options = {
      sampleRate: 22050,
      channels: 1,
      bitsPerSample: 16,
      wavFile: 'recorded.wav',
    };

    AudioRecord.init(options);
    AudioRecord.start();
    setRecording(true);
    setRecordedPath(null);
    setIsPlaying(false);
  };

  const stopRecording = async (autoStop = false) => {
    if (!recording) return;

    const audioFile = await AudioRecord.stop();
    setRecordedPath(audioFile);
    uploadTempAudioFile(audioFile);
    setRecording(false);

    if (autoStop) {
      return audioFile;
    }
  };

  const loadAudio = audioUrl => {
    Sound.setCategory('Playback');
    soundRef.current = new Sound(audioUrl, null, error => {
      if (error) {
        setisAudioUploading(false);
        return;
      }
      // console.log('Sound loaded, duration:', soundRef.current.getDuration());
      setisAudioUploading(false);
    });
  };

  const playRecording = async () => {
    if (!recordedPath) return;

    // if (soundRef.current) {
    //   soundRef.current.stop(() => {
    //     setIsPlaying(false);
    //     soundRef.current.release();
    //     soundRef.current = null;
    //     startNewSound();
    //   });
    // } else {
    startNewSound();
    // }
  };

  const startNewSound = async () => {
    // const sound = new Sound(recordedPath, '', error => {
    //   if (error) {
    //   }
    setIsPlaying(true);
    soundRef.current.play(success => {
      if (success) {
        setIsPlaying(false);
      } else {
        setIsPlaying(false);
      }
      // soundRef.current.release();
      // soundRef.current = null;
    });
    // });
  };

  const stopPlayback = () => {
    const sound = soundRef.current;
    if (!sound) return;

    sound.stop(() => {
      try {
        sound.release();
      } catch (e) {
        console.warn('Release failed:', e.message);
      }

      // soundRef.current.release();
      soundRef.current = null;
      setIsPlaying(false);
    });
  };

  const moveToNewScreen =
    (screenName, data = {}) =>
    () => {
      navigation.navigate(screenName, {data});
    };

  useEffect(() => {
    {
      !!selectedVendorOption && _getAllCarAndPrices(true);
    }
    getDeviceCounrtyCode();
  }, [selectedVendorOption]);

  const getDeviceCounrtyCode = () => {
    deviceCountryCode()
      .then(res => {
        updateState({
          defaultDeviceCountryCode: `+${res[0]?.countryCodes[0]}`,
        });
      })
      .catch(error => {
        console.log(error, 'erroror');
      });
  };
  useEffect(() => {
    updateState({
      updatedAmount: paramData?.couponInfo?.new_amount,
      couponInfo: paramData?.couponInfo,
    });
  }, [paramData?.couponInfo, paramData?.couponInfo?.new_amount]);

  useEffect(() => {
    Geocoder.init(profile?.preferences?.map_key, {language: 'en'}); // set the language
    setTimeout(() => {
      onCenter();
    }, 3000);
    getWalletData();
  }, []);

  useEffect(() => {
    if (!isVisibleMtnGateway && mtnGatewayResponse) {
      showError('Request TimeOut');
      //   navigation.goBack()
      updateState({indicatorLoader: false});
    }
  }, [isVisibleMtnGateway]);

  const onDateSet = useCallback(
    date => {
      let time = moment(date).format('HH:mm ');
      let dateSelectd = moment(date).format('YYYY-MM-DD');
      updateState({
        isLoading: true,
        scheduleDateTime: {
          selectedDateAndTime: `${dateSelectd} ${time}`,
          slectedDate: dateSelectd,
          selectedTime: moment(date).format('HH:mm'),
          date: date,
          isScheduleModalVisible: false,
        },
      });
      updateState({isScheduleModalVisible: false});
      _getAllCarAndPrices(false, {
        selectedDateAndTime: `${dateSelectd} ${time}`,
      });
    },
    [date, selectedCarOption],
  );

  console.log(scheduleDateTime, 'scheduleDateTime>>>>>>');

  const clearScheduleDate = useCallback(() => {
    actions.saveSchduleTime('now');
    updateState({
      isLoading: true,
      scheduleDateTime: {},
    });
    _getAllCarAndPrices(false, {selectedDateAndTime: null});
  }, []);

  //Get list of all orders api
  const _getAllCarAndPrices = (
    showInitalModal = true,
    scheduleDateTime = null,
    _isCabPooling = false,
    seatNo = 1,
    _isBidRide = false,
  ) => {
    if (showInitalModal) {
      updateState({showCarModal: true});
    }
    updateState({isLoading: true});

    const apiQuery = `/${selectedVendorOption?.id}/${paramData?.id}?page=${pageNo}&limit=${limit}`;
    const apiData = {
      locations: paramData?.location,
      schedule_date_delivery: scheduleDateTime?.selectedDateAndTime
        ? scheduleDateTime?.selectedDateAndTime
        : `${pickedUpDate ? pickedUpDate : ''} ${
            pickedUpTime ? pickedUpTime : ''
          }`,
      is_cab_pooling: !!_isCabPooling ? 1 : 0,
      no_seats_for_pooling: !!_isCabPooling ? seatNo : 0,
    };
    {console.log(currencies,'ffsfjojf')}
    const apiHeader = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };

    console.log(apiData, '<===apiData');

    actions
      .getAllCarAndPrices(apiQuery, apiData, apiHeader)
      .then(res => {
        console.log(res, 'resrserserr');
        updateState({
          loyalityAmount: res?.data?.loyalty_amount_saved
            ? Number(res?.data?.loyalty_amount_saved).toFixed(
                appData?.profile?.preferences?.digit_after_decimal,
              )
            : 0,
          availableCarList:
            pageNo == 1
              ? res?.data?.products?.data
              : [...availableCarList, ...res?.data?.products?.data],
          selectedCarOption: res?.data?.products?.data[0],
          showBidPriceModal:
            res?.data?.products?.data[0] && _isBidRide ? true : false,
          isLoading: false,
          isRefreshing: false,
        });
        setShowFinalUpdatedSeatNo(seatNo);
        setBidRidePrice(res?.data?.products?.data[0]?.tags_price);
      })
      .catch(errorMethod);
  };

  const _onUpdateSeatNo = type => {
    let seatNo = updateSeatNO;
    if (type == 'increase') {
      seatNo = seatNo + 1;
      setUpdateSeatNo(seatNo);
    } else {
      seatNo = seatNo - 1;
      setUpdateSeatNo(seatNo);
    }

    !!pickUpTimeType && pickUpTimeType == 'now'
      ? _getAllCarAndPrices(true, null, true, seatNo)
      : onDateSet(pickUpTimeType);
  };

  let redirectTimeout = useRef();

  //flutter wave

  const handleOnRedirect = data => {
    // clear scheduled action
    clearTimeout(redirectTimeout.current);
    // delay action to prevent from reoccurring
    redirectTimeout.current = setTimeout(() => {
      try {
        if (data && data?.transaction_id) {
          let apiData = {
            payment_option_id: paymentDataFlutterWave?.payment_option_id,
            order_number: paymentDataFlutterWave?.orderDetail?.order_number,
            transaction_id: data?.transaction_id,
            amount: paymentDataFlutterWave?.total_payable_amount,
            action: 'pickup_delivery',
          };

          actions
            .openSdkUrl(
              `/${paymentDataFlutterWave?.selectedPayment?.code?.toLowerCase()}`,
              apiData,
              {
                code: appData?.profile?.code,
                currency: currencies?.primary_currency?.id,
                language: languages?.primary_language?.id,
              },
            )
            .then(res => {
              console.log(res, 'open..SdkUrl');
              if (res && res?.status == 'Success') {
                console.log(
                  paymentDataFlutterWave,
                  'paymentDataFlutterWave....',
                );
                let newOrderDetail = paymentDataFlutterWave?.orderDetail;
                newOrderDetail['dispatch_traking_url'] =
                  res?.data?.dispatch_traking_url;
                paymentDataFlutterWave['orderDetail'] = newOrderDetail;
                updateState({
                  indicatorLoader: false,
                });
                navigation.navigate(navigationStrings.PICKUPTAXIORDERDETAILS, {
                  ...paymentDataFlutterWave,
                  orderId: paymentDataFlutterWave?.orderDetail?.id,
                  fromCab: true,
                });
              } else {
                redirectTimeout = setTimeout(() => {
                  // do something with the result
                  updateState({
                    isModalVisibleForPayFlutterWave: false,
                    indicatorLoader: false,
                    // deliveryFeeLoader: false,
                  });
                }, 200);
              }
            })
            .catch(error => {
              console.log(error, 'errorerrorerrorerrorerror');
              updateState({
                isModalVisibleForPayFlutterWave: false,
                indicatorLoader: false,
              });
            });
        } else {
          let apiData = {
            order_number: paymentDataFlutterWave?.orderDetail?.order_number,
            action: 'cart',
          };
          actions
            .cancelSdkUrl(
              `/${paymentDataFlutterWave?.selectedPayment?.code?.toLowerCase()}`,
              apiData,
              {
                code: appData?.profile?.code,
                currency: currencies?.primary_currency?.id,
                language: languages?.primary_language?.id,
              },
            )
            .then(res => {
              console.log(res, 'cancelPaytabUrl---resfrompaytab');
              redirectTimeout = setTimeout(() => {
                // do something with the result
                updateState({
                  isModalVisibleForPayFlutterWave: false,
                  indicatorLoader: false,
                  deliveryFeeLoader: false,
                });
              }, 200);
            })
            .catch(error => console.log(error, 'errorrrr'));
        }
      } catch (error) {
        console.log('error raised', error);
        redirectTimeout = setTimeout(() => {
          // do something with the result
          updateState({
            isModalVisibleForPayFlutterWave: false,
            indicatorLoader: false,
          });
        }, 200);
      }
    }, 100);
  };

  //error handling of api
  const errorMethod = error => {
    // alert("utyhtgyrtertcytfgh")
    console.log(error, 'errorOccured');
    updateState({
      isLoading: false,
      isRefreshing: false,
      indicatorLoader: false,
      isModalVisibleForPayFlutterWave: false,
    });
    showError(error?.message || error?.error || error?.description);
  };

  const sendStripeToken = (extraData, data) => {
    data['order_number'] = extraData?.orderDetail?.order_number;
    data['action'] = 'pickup_delivery';
    data['stripe_token'] = paramData?.tokenInfo;
    data['card_last_four_digit'] = paramData?.cardInfo?.last4;
    data['card_expiry_month'] = paramData?.cardInfo?.expiryMonth;
    data['card_expiry_year'] = paramData?.cardInfo?.expiryYear;

    actions
      .openPaymentWebUrlPost(`/${selectedPayment?.code}`, data, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(res => {
        console.log(res, 'res>>>>>++++++++');
        updateState({
          isModalVisible: false,
          isLoading: false,
          isRefreshing: false,
          indicatorLoader: false,
        });
        let newObj = extraData?.orderDetail;
        newObj['dispatch_traking_url'] = res?.data?.data?.dispatch_traking_url;
        extraData['orderDetail'] = newObj;

        navigation.navigate(
          navigationStrings.PICKUPTAXIORDERDETAILS,
          extraData,
        );
      })
      .catch(errorMethod);
  };

  const checkPaymentOptions = (extraData, res) => {
    let paymentId = selectedPayment?.id;
    let paymentData = {
      total_payable_amount: !!route?.params?.bidData?.bid_price
        ? Number(route?.params?.bidData?.bid_price) +
          Number(selectedCarOption?.taxable_amount) +
          Number(paramData?.serviceCharge)
        : Number(
            extraData?.orderDetail?.payable_amount
              ? extraData?.orderDetail?.payable_amount
              : extraData?.orderDetail?.total_amount,
          ),
      payment_option_id: selectedPayment?.id,
      orderDetail: extraData?.orderDetail,
      redirectFrom: 'pickup_delivery',
      selectedPayment: selectedPayment,
      extraData: extraData,
      selectedPayid: paramData?.secondPaymentId,
      methodName: paramData?.methodName,
      serviceCharge: paramData?.serviceCharge,
    };
    console.log(
      paymentData,
      'ygyggygpaymentData',
      selectedCarOption?.taxable_amount,
    );
    updateState({
      isModalVisible: false,
      isLoading: false,
      isRefreshing: false,
      indicatorLoader: false,
    });
    switch (paymentId) {
      case 4: //Stripe Payment Getway
        sendStripeToken(extraData, res);
        break;
      case 6: //Payfast Payment Getway
        navigation.navigate(navigationStrings.PAYFAST, paymentData);
        break;
      case 32: //PAYPHONE Payment Getway
        navigation.navigate(navigationStrings.PAYPHONE, paymentData);
        break;
      case 18: //Authorize.net Payment Gatway
        navigation.navigate(navigationStrings.AuthorizeNet, paymentData);
        break;
      case 5: // PayStack Payment Getway
        navigation.navigate(navigationStrings.PAYSTACK, paymentData);
        break;
      case 42: //DIRECTPAYONLINE Payment Gatway
        navigation.navigate(navigationStrings.DIRECTPAYONLINE, paymentData);
        break;
      case 47: //Khalti Payment Gatway
        navigation.navigate(navigationStrings.KHALTI, paymentData);
        break;
      case 57: //PesaPal Payment Gatway
        navigation.navigate(navigationStrings.PESAPAL, paymentData);
        break;
      case 59: //PesaPal Payment Gatway
        navigation.navigate(navigationStrings.LIVESS, paymentData);
        break;
      case 30: //FlutterWave Payment Getway
        updateState({
          isModalVisibleForPayFlutterWave: true,
          paymentDataFlutterWave: paymentData,
        });
        break;
      case 64: //mtfatoora
        navigation.navigate(navigationStrings.MYFATOORAH, paymentData);
        break;
      case 69: //mtfatoora
        navigation.navigate(navigationStrings.MYFATOORAH, paymentData);
        break;
      default:
        navigation.navigate(
          navigationStrings.PICKUPTAXIORDERDETAILS,
          extraData,
        );
        break;
    }
  };

  const paymentReponse = (res, extraData) => {
    axios({
      method: 'get',
      url: res?.responseUrl,
      headers: {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
        authorization: `${userData.auth_token}`,
      },
    })
      .then(response => {
        console.log(response, 'reseserserseeseers');
        if (response?.data?.status == 'SUCCESSFUL') {
          setIsVisibleMtnGateway(false);
          navigation.navigate(
            navigationStrings.PICKUPTAXIORDERDETAILS,
            extraData,
          );
          showSuccess(response?.data?.message);
        }
      })
      .catch(error => {
        console.log(error, 'error');
        setMtnGatewayResponse('');
        setIsVisibleMtnGateway(false);
        showError(error?.response?.data?.message);
        updateState({indicatorLoader: false});
      });
  };
  useInterval(
    () => {
      if (!!isVisibleMtnGateway) {
        paymentReponse(mtnGatewayResponse, pickuporderdetails);
      }
    },
    !!isVisibleMtnGateway ? 5000 : null,
  );

  const _paymentWithPlugnPayMethods = (extraData, response, data) => {
    console.log(extraData, response, paramData, 'extradataextradata');
    let selectedMethod = paramData?.selectedMethod?.code;
    let CardNumber = paramData?.Card_Number.split(' ').join('');
    let expirydate;

    if (paramData?.selectedMethod?.id == 50) {
      expirydate = paramData?.year.concat(paramData?.date);
      console.log(expirydate, paramData?.year, paramData?.date, 'expirydate');
    } else {
      expirydate = paramData?.expiryDate;
    }

    actions
      .openPaymentWebUrl(
        `/${selectedMethod}?amount=${
          response?.data?.payable_amount || data?.amount
        }&cv=${
          paramData?.cvc
        }&dt=${expirydate}&cno=${CardNumber}&order_number=${
          response?.data?.order_number
        }&action=pickup_delivery`,
        {},
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      )
      .then(res => {
        console.log(res, 'Response>>>>>');
        if (res && res?.status == 'Success') {
          let newObj = extraData?.orderDetail;
          newObj['dispatch_traking_url'] =
            res?.data?.data?.dispatch_traking_url;
          extraData['orderDetail'] = newObj;
          navigation.navigate(
            navigationStrings.PICKUPTAXIORDERDETAILS,
            extraData,
          );
        }
      })
      .catch(err => {
        console.log('Error>>>>>>>>>>>', err);
        showError(err?.msg);
      });
  };

  const mtnGateway = (extraData, response, data) => {
    console.log(response, 'rsresresrersserres');
    let dataforGateway = {};
    dataforGateway['amount'] = response?.data?.payable_amount || data?.amount;
    dataforGateway['currency'] = currencies?.primary_currency?.iso_code;
    dataforGateway['order_no'] = response?.data?.order_number;
    dataforGateway['subscription_id'] = '';
    dataforGateway['reload_route'] = response?.data?.dispatch_traking_url;
    dataforGateway['from'] = 'pickup_delivery';

    actions
      .mtnGateway(dataforGateway, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(res => {
        console.log(res, 'rsrseereeseresre');
        if (res?.status == 'Success') {
          setIsVisibleMtnGateway(true);
          setMtnGatewayResponse(res);
          setPickuporderdetails(extraData);
          paymentReponse(res, extraData);
        }
      })
      .catch(err => {
        console.log(err, 'ererrerererere');
        updateState({isLoadingB: false, placeLoader: false});
        showError(err?.message);
      });
  };

  const _finalPayment = data => {
    if (
      isEmpty(selectedPayment) &&
      selectedCarOption?.remaining_amount != 0 &&
      !(Number(updatedAmount) == Number(selectedCarOption?.tags_price))
    ) {
      _redirectToPayement();
      return;
    }

    updateState({
      isLoading: true,
      indicatorLoader: true,
    });

    console.log(data, '<===sending data');
    actions
      .placeDelievryOrder(data, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(res => {
        console.log(res, 'uhuhuttfrtdrdr');
        if (res && res?.status == 200) {
          let extraData = {
            orderId: res?.data?.id,
            fromVendorApp: true,
            selectedVendor: {id: selectedCarOption?.vendor_id},
            orderDetail: res?.data,
            fromCab: paramData?.pickup_taxi ? false : true,
            pickup_taxi: paramData?.pickup_taxi,
            totalDuration: totalDuration,
            selectedCarOption: selectedCarOption?.sku,
          };
          if (selectedPayment?.id == 49 || selectedPayment?.id == 50) {
            _paymentWithPlugnPayMethods(extraData, res, data);
          } else if (selectedPayment?.id == 48) {
            mtnGateway(extraData, res, data);
          } else {
            checkPaymentOptions(extraData, data);
          }
        } else {
          console.log(res, 'res>>>>>');
          updateState({
            isModalVisible: false,
            isLoading: false,
            isRefreshing: false,
            indicatorLoader: false,
          });
          showError(res?.message || res?.error);
        }
      })
      .catch(errorMethod);
  };
  const getWalletData = () => {
    actions
      .walletHistory(
        `?page=${pageNo}&limit=${limit}`,
        {},
        {
          code: appData?.profile?.code,
        },
      )
      .then(res => {
        console.log(res, 'Wallet Responce');
        setWalletAmount(res?.data?.wallet_amount);
      })
      .catch(errorMethod);
  };
  const _confirmAndPay = () => {
    console.log(
      selectedCarOption?.total_tags_price,
      selectedCarOption?.tags_price,
      '',
    );
    const orderFinalPrice = useWalletMoney
      ? paramData?.bidData?.bid_price
        ? Number(paramData?.bidData?.bid_price) -
          Number(selectedCarOption?.wallet_amount_used)
        : selectedCarOption?.tags_price
        ? selectedCarOption?.tags_price -
          Number(selectedCarOption?.wallet_amount_used)
        : selectedCarOption?.total_tags_price -
          Number(selectedCarOption?.wallet_amount_used)
      : paramData?.bidData?.bid_price
      ? Number(paramData?.bidData?.bid_price)
      : selectedCarOption?.tags_price
      ? selectedCarOption?.tags_price
      : selectedCarOption?.total_tags_price;
    if (
      isEmpty(selectedPayment?.title) &&
      !(Number(updatedAmount) == Number(selectedCarOption?.tags_price)) &&
      !(
        (paramData?.bidData && paramData?.showPaymentModal
          ? Number(paramData?.bidData?.bid_price)?.toFixed(2)
          : selectedCarOption
          ? Number(selectedCarOption?.tags_price)?.toFixed(2)
          : 0.121) === Number(selectedCarOption?.wallet_amount_used)?.toFixed(2)
      )
    ) {
      _redirectToPayement();
      return;
    }
    let data = {};
    data['task_type'] = scheduleDateTime?.selectedDateAndTime
      ? ''
      : pickUpTimeType
      ? pickUpTimeType
      : '';
    data['schedule_time'] = scheduleDateTime?.selectedDateAndTime
      ? `${scheduleDateTime?.selectedDateAndTime}`
      : pickUpTimeType == 'now'
      ? ''
      : slectedDate && selectedTime && `${slectedDate} ${selectedTime}`;
    data['recipient_phone'] = '';
    data['recipient_email'] = '';
    data['task_description'] = taskInstruction;
    data['amount'] = orderFinalPrice;
    data['tags_amount'] = selectedCarOption?.tags_price;
    data['tollamount'] = selectedCarOption?.toll_fee
      ? selectedCarOption?.toll_fee
      : 0;
    data['servicechargeamount'] = selectedCarOption?.service_charge_amount
      ? selectedCarOption?.service_charge_amount
      : 0;
    data['payment_option_id'] = selectedPayment ? selectedPayment?.id : 1;
    data['vendor_id'] = selectedCarOption?.vendor_id;
    data['product_id'] = selectedCarOption?.id;
    data['currency_id'] = currencies?.primary_currency?.id;
    data['tasks'] = paramData?.tasks;
    data['gov_tax'] = selectedCarOption?.gov_tax;
    data['htc_tax'] = selectedCarOption?.htc_tax;
    data['state_tax'] = selectedCarOption?.state_tax;
    data['myfatoorah_fee'] = selectedCarOption?.myfatoorah_fee;
    data['service_fee'] = selectedCarOption?.service_fee;
    data['images_array'] = uploadImages;
    data['wallet_used'] = useWalletMoney;
    data['unique_id'] = uID;
    if (!!paramData?.bidData?.id) {
      data['bid_id'] = paramData?.bidData?.id;
    }
    data['agent_id'] = paramData?.bidData?.driver_id;
    if (paramData?.bidData?.driver_id) {
      data['bid_task_type'] = paramData?.bidData?.task_type;
    }
    data['user_product_order_form'] = allSubmittedAnswers
      ? allSubmittedAnswers
      : [];
    data['is_postpay'] = profile?.preferences?.is_postpay_enable;
    if (couponInfo) {
      data['coupon_id'] = couponInfo?.id;
    }
    data['order_time_zone'] = RNLocalize.getTimeZone();
    data['is_cab_pooling'] = cabBookingType == 'Pooling' ? 1 : 0;
    data['no_seats_for_pooling'] = updateSeatNO;
    data['bookingType'] = paramData?.friendBookingDetails?.bookingType;
    data[
      'friendName'
    ] = `${paramData?.friendBookingDetails?.firstName} ${paramData?.friendBookingDetails?.lastName}`;
    data['friendPhoneNumber'] = paramData?.friendBookingDetails?.bookingType
      ? paramData?.friendBookingDetails?.mobileNumber?.includes('+')
        ? paramData?.friendBookingDetails?.mobileNumber
        : ` ${defaultDeviceCountryCode}${paramData?.friendBookingDetails?.mobileNumber}`
      : '';
    data['call_notification'] = 1;
    if (!!paramData?.secondPaymentId) {
      data['PaymentMethodId'] = paramData?.secondPaymentId;
    }
    if (!!paramData?.serviceCharge) {
      data['ServiceCharge'] = paramData?.serviceCharge;
    }
    if (!!paramData?.driverType) {
      data['selected_rider_option'] =
        paramData?.driverType === 'Male'
          ? 'men'
          : paramData?.driverType === 'Female'
          ? 'women'
          : 'all';
    }
    console.log(data.amount, 'ijgfiigffgijfgij');
    if (!!paramData?.captain_nationality) {
      data['captain_nationality'] = paramData?.captain_nationality;
    }
    if (
      !!(
        !!userData?.client_preference?.verify_email &&
        !userData?.verify_details?.is_email_verified
      ) ||
      !!(
        !!userData?.client_preference?.verify_phone &&
        !userData?.verify_details?.is_phone_verified
      )
    ) {
      moveToNewScreen(navigationStrings.VERIFY_ACCOUNT_TAXI, {
        ...userData,
        fromCart: true,
      })();
    } else {
      selectedPayment.id == 10 ? renderRazorPay(data) : _finalPayment(data);
    }
  };
  const renderRazorPay = data => {
    let options = {
      description: 'Payment for your order',
      image: getImageUrl(
        appData?.profile?.logo?.image_fit,
        appData?.profile?.logo?.image_path,
        '1000/1000',
      ),
      currency: currencies?.primary_currency?.iso_code,
      key: appData?.profile?.preferences?.razorpay_api_key, // Your api key
      amount: Number(selectedCarOption?.total_tags_price) * 100,
      name: appData?.profile?.company_name,
      prefill: {
        email: userData?.email,
        contact: userData?.phone_number || '',
        name: userData?.name,
      },
      theme: {color: themeColors.primary_color},
    };

    // RazorpayCheckout.open(options)
    //   .then(res => {
    //     console.log(`Success for razor: `, res);
    //     if (res?.razorpay_payment_id) {
    //       data['transaction_id'] = res?.razorpay_payment_id;
    //       _finalPayment(data); // placeOrder
    //     }
    //   })
    //   .catch(errorMethod);
  };

  const onPressAvailableVendor = item => {
    updateState({
      isLoading: true,
      availableCarList: [],
      pageNo: 1,
      selectedVendorOption: item,
    });
  };
  //Modal to select car

  //getAllNearByDrivers
  useEffect(() => {
    chekLocationPermission(false)
      .then(result => {
        if (result !== 'goback') {
          getCurrentLocation('home')
            .then(res => {
              updateState({
                myCurrentLocationDetails: res,
              });
            })
            .catch(err => {
              console.log('error raised', location);
              // console.log("default location",location)
            });
        }
      })
      .catch(error => console.log('error while accessing location', error));
  }, []);

  const _selectedProductForDrivers = item => {
    updateState({
      selectedCarOption: item,
      showBidPriceModal: cabBookingType == 'bidRide' ? true : false,
    });
    if (cabBookingType !== 'bidRide') {
      setIsCabBooking(true);
    }
    setBidRidePrice(
      route?.params?.id == 23 || route?.params?.id == 25
        ? ''
        : item?.tags_price,
    );
  };

  useEffect(() => {
    if (
      myCurrentLocationDetails?.latitude &&
      myCurrentLocationDetails?.longitude
    ) {
      getAllDrivers();
    }
  }, [selectedCarOption?.tags]);

  const getAllDrivers = () => {
    actions
      .getAllNearByDrivers(
        {
          latitude: myCurrentLocationDetails?.latitude,
          longitude: myCurrentLocationDetails?.longitude,
          // tag: selectedCarOption?.tags,
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
        });
      })
      .catch(errorMethod);
  };

  const fetchSnapped = async allDrivers => {
    const snappedArray = await getSnappedLocations(allDrivers);
    setonRoadDrivers(snappedArray);
  };

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
            };
          }
          return {lat: actualLat, long: actualLong, headingAngle, vehicleType}; // fallback if no road found
        } catch (err) {
          return {lat: actualLat, long: actualLong, headingAngle, vehicleType}; // fallback on error
        }
      }),
    );
  }

  const renderVendors = ({item}) => {
    return (
      <TouchableOpacity
        disabled={selectedVendorOption.id == item.id}
        onPress={() => onPressAvailableVendor(item)}
        style={{
          padding: moderateScale(8),
          borderBottomWidth: selectedVendorOption.id == item.id ? 1 : 0,
          borderColor: themeColors.primary_color,
        }}>
        <Text
          style={{
            fontSize: textScale(14),
            fontFamily: fontFamily?.bold,
            color: isDarkMode ? colors.white : colors.black,
          }}>
          {item?.name || item?.translation_title}
        </Text>
      </TouchableOpacity>
    );
  };

  const carModalHeader = () => {
    if (!!showPaymentModal) {
      return (
        <View
          style={{
            backgroundColor: isDarkMode
              ? MyDarkTheme.colors.background
              : colors.white,
            padding: moderateScale(16),
            // alignItems: 'center',
            borderRadius: 8,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            {!!(paramData?.showPaymentModal && cabBookingType == 'bidRide') ? (
              <View />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (redirectFromNow) {
                    if (availableCarList.length <= 2) {
                      setBottomSheetIndex(0);
                    }
                    updateState({showCarModal: true, showPaymentModal: false});
                  } else {
                    updateState({showPaymentModal: false});
                  }
                }}>
                <Image
                  style={isDarkMode && {tintColor: MyDarkTheme.colors.text}}
                  source={imagePath.backArrowCourier}
                />
              </TouchableOpacity>
            )}
            <View
              style={{
                backgroundColor: isDarkMode
                  ? colors.whiteOpacity77
                  : colors.black,
                width: moderateScale(40),
                height: moderateScale(4),
                borderRadius: 8,
                marginRight: moderateScale(34),
              }}
            />
            <Text />
          </View>
        </View>
      );
    }
    return (
      <View
        style={{
          backgroundColor: isDarkMode
            ? MyDarkTheme.colors.background
            : colors.white,
          borderRadius: 8,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          marginTop: moderateScaleVertical(18),
        }}>
        <View
          style={{
            alignItems: 'center',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Image style={{opacity: 0}} source={imagePath.backArrowCourier} />
            <View
              style={{
                backgroundColor: isDarkMode
                  ? colors.whiteOpacity77
                  : colors.black,
                width: moderateScale(40),
                height: moderateScale(4),
                borderRadius: 8,
                marginRight: moderateScale(34),
              }}
            />
          </View>
        </View>
        {is_cab_pooling || is_bid_ride_enable ? (
          <View
            style={{
              marginHorizontal: moderateScale(16),
              marginVertical: moderateScaleVertical(10),
              flexDirection: 'row',
            }}>
            {!!(is_cab_pooling || is_bid_ride_enable) &&
            route?.params?.id != 23 &&
            route?.params?.id != 25 ? (
              <TouchableOpacity
                onPress={() => {
                  _getAllCarAndPrices();
                  setCabBookingType('Booking');
                }}
                style={{
                  ...styles.cabBookingTyp,
                  borderColor:
                    cabBookingType == 'Booking'
                      ? themeColors?.primary_color
                      : isDarkMode
                      ? colors.white
                      : colors.borderColorB,
                }}>
                <Image
                  style={{
                    width: moderateScale(54),
                    height: moderateScaleVertical(54),
                    resizeMode: 'contain',
                  }}
                  source={imagePath.bookacab}
                />
                <Text
                  style={{
                    ...styles.bookingTitle,
                    color:
                      cabBookingType == 'Booking'
                        ? isDarkMode
                          ? colors.white
                          : themeColors?.primary_color
                        : isDarkMode
                        ? colors.white
                        : colors.black,
                  }}>
                  {strings.BOOKACAB}
                </Text>
              </TouchableOpacity>
            ) : null}
            {!!is_bid_ride_enable ? (
              <TouchableOpacity
                onPress={() => {
                  setCabBookingType('bidRide');
                  _getAllCarAndPrices(true, null, false, 1, true);
                }}
                style={{
                  ...styles.cabBookingTyp,
                  marginLeft:
                    route?.params?.id == 23 || route?.params?.id == 25
                      ? moderateScale(4)
                      : moderateScale(24),
                  borderColor:
                    cabBookingType == 'bidRide'
                      ? themeColors?.primary_color
                      : isDarkMode
                      ? colors.white
                      : colors.borderColorB,
                }}>
                <Image
                  style={{
                    width: moderateScale(52),
                    height: moderateScaleVertical(52),
                    resizeMode: 'contain',
                    left: moderateScale(4),
                  }}
                  source={imagePath.bidcaric}
                />
                <Text
                  style={{
                    ...styles.bookingTitle,
                    color:
                      cabBookingType == 'bidRide'
                        ? isDarkMode
                          ? colors.white
                          : themeColors?.primary_color
                        : isDarkMode
                        ? colors.white
                        : colors.black,
                  }}>
                  {' '}
                  {strings.BID_RIDE}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <View style={{marginVertical: moderateScale(8)}}>
          {/* {!isEmpty(availableVendors) ? (
                        <FlatList
                            horizontal
                            data={availableVendors}
                            renderItem={renderVendors}
                            extraData={availableVendors}
                            contentContainerStyle={{
                                marginHorizontal: moderateScale(16),
                                marginBottom: moderateScaleVertical(16)
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={{ marginRight: moderateScale(12) }} />
                            )}
                            ListHeaderComponent={() => (
                                <View style={{ marginLeft: moderateScale(16) }} />
                            )}
                            ListFooterComponent={() => (
                                <View style={{ marginRight: moderateScale(16) }} />
                            )}
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : null} */}
        </View>
      </View>
    );
  };

  const _selectCarModalView = () => {
    return (
      <AvailableDriver
        isCabPooling={
          !!cabBookingType && cabBookingType == 'Pooling' ? true : false
        }
        onPressAvailableCar={_selectedProductForDrivers}
        rideType={cabBookingType}
        disabled={disableButton}
        timeduration={selectedCarOption?.duration}
        isLoading={isLoading}
        _onUpdateSeatNo={_onUpdateSeatNo}
        updateSeatNo={showFinalUpdatedSeatNo}
        selectedCarOption={selectedCarOption}
        allListedDrivers={allListedDrivers}
        onPressPickUpNow={() => {
          selectedCarOption
            ? updateState({
                // pickUpTimeType: 'now',
                showPaymentModal: true,
                redirectFromNow: true,
                showCarModal: false,
              })
            : showError(strings.PLEASE_SELECT_CAR);
        }}
        onPressPickUplater={() => {
          selectedCarOption
            ? updateState({
                // pickUpTimeType: 'schedule',
                redirectFromNow: false,
                showCarModal: false,
              })
            : showError(strings.PLEASE_SELECT_CAR);
        }}
        availableCarList={availableCarList}
        // onPressAvailableVendor={(item) => onPressAvailableVendor(item)}
        selectedVendorOption={selectedVendorOption}
        _select={() => {
          selectedVendorOption
            ? _getAllCarAndPrices(true)
            : showError(strings.PLEASE_SELECT_OPTION);
        }}
        availableVendors={availableVendors}
        navigation={navigation}
        _onShowBidePriceModal={_onShowBidePriceModal}
      />
    );
  };

  const _redirectToPayement = () => {
    let amountplusTax =
      Number(selectedCarOption?.taxable_amount) > 0
        ? Number(selectedCarOption?.tags_price) +
          Number(selectedCarOption?.taxable_amount)
        : Number(selectedCarOption?.tags_price);
    moveToNewScreen(navigationStrings.PAYMENT_OPTIONS, {
      screenName: strings.PAYMENT,
      paramData: paramData,
      currentAmount: useWalletMoney
        ? amountplusTax - Number(selectedCarOption?.wallet_amount_used)
        : amountplusTax,
    })();
  };

  const uploadImage = async img => {
    console.log('selected image', img);
    let fileName = img.path.split('Pictures/');
    console.log(fileName, 'fileName...');
    const imgData = new FormData();
    imgData.append('upload_photo', {
      uri: img.path,
      name: fileName[1],
      fileName: fileName[1],
      type: img.mime,
    });
    try {
      const res = await actions.imageUpload(imgData, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
        'Content-Type': 'multipart/form-data',
      });
      console.log('image upload res', res);
      updateState({
        uploadImages: [...uploadImages, ...[res.image]],
      });
    } catch (error) {
      console.log('erro rraised', error);
      showError(error?.error || error?.message);
    }
  };

  const updateInstruction = val => {
    updateState({taskInstruction: val});
  };

  const onQuestionAnswerSubmit = item => {
    updateState({
      allSubmittedAnswers: item,
    });
  };
  //Biding Rice Funcationality>>>>>>>>>>>>>>>>>>

  const _onRidePriceIncerimentDecrimentPrice = async type => {
    if (type == 'minus') {
      return (await Number(bidRidePrice)) - 0.25;
    } else {
      return (await Number(bidRidePrice)) + 0.25;
    }
  };
  const _onSetBidPrice = async type => {
    console.log(
      selectedCarOption?.min_tags_price,
      'fdfdnselectedCarOption?.min_tags_price',
    );
    const selectedBidPrice = await _onRidePriceIncerimentDecrimentPrice(type);
    // if (selectedBidPrice < selectedCarOption?.min_tags_price) {
    //     alert(`you can't select price below ${selectedCarOption?.min_tags_price}`)
    //     setBidRidePrice(selectedCarOption?.min_tags_price)
    // }
    if (selectedBidPrice < 0.0) {
      alert(`you can't select price below ${0.0}`);
      setBidRidePrice('0.00');
    } else {
      setBidRidePrice(selectedBidPrice.toFixed(3).toString());
    }
  };

  const _onCreateBidRequest = async (autoStopPath = '') => {
    setBideRequestLoading(true);

    let formdata = new FormData();
    formdata.append('product_id', selectedCarOption?.id);
    formdata.append('vendor_id', selectedCarOption?.vendor_id);
    formdata.append('tasks', JSON.stringify(paramData?.tasks));
    formdata.append('requested_price', Number(bidRidePrice).toFixed(2));
    formdata.append(
      'min_requested_price',
      selectedCarOption?.min_tags_price || 0,
    );
    formdata.append(
      'max_requested_price',
      selectedCarOption?.max_tags_price || 0,
    );
    formdata.append('description', bidDescription);
    if (recordedPath) {
      formdata.append('audio', {
        uri: 'file://' + recordedPath, // or use just recordedPath on iOS
        type: 'audio/wav',
        name: 'recording.wav',
      });
    } else if (!isEmpty(autoStopPath)) {
      formdata.append('audio', {
        uri: 'file://' + autoStopPath, // or use just recordedPath on iOS
        type: 'audio/wav',
        name: 'recording.wav',
      });
    }

    const apiHeader = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
      'Content-Type': 'multipart/form-data',
    };
    actions
      .createBidRequest(formdata, apiHeader)
      .then(res => {
        stopPlayback();
        const apiResponseData = res?.data;
        showSuccess(res?.message);
        setBideRequestLoading(false);
        updateState({
          showBidPriceModal: false,
        });
        setTimeout(() => {
          setBidRidePrice(selectedCarOption?.tags_price);
          moveToNewScreen(navigationStrings.BIDINGDRIVERSLIST, {
            paramData: {...paramData, apiResponseData},
          })();
        }, 1000);
      })
      .catch(error => {
        showError(error?.message);
        setBideRequestLoading(false);
        updateState({
          showBidPriceModal: false,
        });
      });
  };

  const uploadTempAudioFile = async audioPath => {
    setisAudioUploading(true);
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
        loadAudio(res?.audio_url);
      })
      .catch(error => {
        setisAudioUploading(false);
      });
  };

  // bid price modal show hide
  const _onShowBidePriceModal = selectedCar => {
    updateState({
      selectedCarOption: selectedCar,
      showBidPriceModal: true,
    });
  };
  const _bidModalClose = () => {
    updateState({
      showBidPriceModal: false,
    });
  };

  //show paymentModal after bid accept
  useEffect(() => {
    if (paramData?.showPaymentModal) {
      updateState({
        showPaymentModal: paramData?.showPaymentModal,
        showCarModal: false,
      });
    }
  }, [paramData]);

  // fare price modal Main view
  const _ModalFarePriceMainView = () => {
    return (
      <View>
        <View
          style={{
            // borderWidth: 1,
            // borderColor: colors.borderColorB,
            padding: moderateScale(8),
            borderRadius: moderateScale(12),
            marginTop: moderateScaleVertical(10),
          }}>
          <View
            style={{
              width: moderateScale(width - 40),
              alignItems: 'center',
              paddingVertical: moderateScaleVertical(10),
              borderRadius: moderateScale(8),
            }}>
            <FastImage
              resizeMode={FastImage.resizeMode.contain}
              style={{
                height: moderateScale(100),
                width: moderateScale(100),
              }}
              source={{
                uri: selectedCarOption?.media[0]?.image?.path?.original_image,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: moderateScale(28),
                alignItems: 'center',
                marginTop: moderateScaleVertical(12),
              }}>
              <Text
                style={{
                  fontFamily: fontFamily?.bold,
                  fontSize: textScale(20),
                }}>
                {' '}
                {selectedCarOption?.translation[0]?.title}
              </Text>
              <View>
                {!isEmpty(selectedCarOption?.duration) ? (
                  <Text
                    style={{
                      ...styles.vechilePriceName,
                      color: isDarkMode
                        ? colors.whiteOpacity50
                        : colors.textColor,

                      textAlign: 'justify',
                    }}>
                    {strings.ETIME} : {selectedCarOption?.duration}{' '}
                    {Number(selectedCarOption?.duration) > 10
                      ? strings.MINS
                      : strings.MIN}
                  </Text>
                ) : null}
                {!isEmpty(selectedCarOption?.distance) ? (
                  <Text
                    style={{
                      ...styles.vechilePriceName,
                      color: isDarkMode
                        ? colors.whiteOpacity50
                        : colors.textColor,
                      textAlign: 'justify',
                      marginTop: moderateScaleVertical(10),
                    }}>
                    {strings.DISTANCE} : {selectedCarOption?.distance}{' '}
                    {strings.KM}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: moderateScaleVertical(20),
              paddingHorizontal: moderateScale(28),
            }}>
            <TouchableOpacity
              style={{
                backgroundColor: themeColors?.primary_color,
                flex: Platform.OS === 'ios' ? 0.35 : 0.25,
                height: moderateScaleVertical(50),
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: moderateScale(8),
              }}
              onPress={() => _onSetBidPrice('minus')}>
              <Text style={{color: colors.white, fontFamily: fontFamily?.bold}}>
                - 0.250
              </Text>
            </TouchableOpacity>

            <View style={{flex: 0.6, marginHorizontal: moderateScale(10)}}>
              <TextInputWithUnderlineAndLabel
                maxLength={8}
                txtInputStyle={{textAlign: 'center'}}
                isEditable={true}
                keyboardType="numeric"
                placeholder={''}
                // onChangeText={(text) => setBidRidePrice(text)}
                onChangeText={val => {
                  const regex = /^\d*\.?\d*$/;
                  if (regex.test(val)) {
                    setBidRidePrice(val);
                  }
                }}
                value={bidRidePrice}
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: themeColors?.primary_color,
                flex: Platform.OS === 'ios' ? 0.35 : 0.25,
                height: moderateScaleVertical(50),
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: moderateScale(8),
              }}
              onPress={() => _onSetBidPrice('plus')}>
              <Text style={{color: colors.white, fontFamily: fontFamily?.bold}}>
                + 0.250
              </Text>
            </TouchableOpacity>
          </View>
          {route?.params?.id == 23 || route?.params?.id == 25 ? (
            <TextInput
              placeholder={strings.ENTER_DESCRIPTION}
              placeholderTextColor={colors.borderColor}
              style={{
                borderWidth: 2,
                borderColor: colors.borderColor,
                borderRadius: moderateScale(8),
                fontFamily: fontFamily.medium,
                paddingHorizontal: moderateScale(10),
                width: moderateScale(330),
                alignSelf: 'center',
                marginVertical: moderateScaleVertical(10),
                height: moderateScaleVertical(60),
              }}
              value={bidDescription}
              onChangeText={setbidDescription}
            />
          ) : null}
          {route?.params?.id == 23 || route?.params?.id == 25 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: moderateScale(18),
                marginVertical: moderateScaleVertical(12),
                height: moderateScaleVertical(56),
              }}>
              <View
                style={{
                  flex: 0.32,
                }}
              />
              <View
                style={{
                  flex: 0.35,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {recordedPath ? (
                  isAudioUploading ? (
                    <View
                      style={{
                        alignSelf: 'center',
                        alignItems: 'center',
                      }}>
                      <BallIndicator size={moderateScale(28)} />
                      <Text
                        style={{
                          fontFamily: fontFamily.medium,
                          fontSize: textScale(12),
                          marginTop: moderateScaleVertical(8),
                        }}></Text>
                    </View>
                  ) : isPlaying ? (
                    <View
                      // onPress={stopPlayback}
                      style={{
                        alignSelf: 'center',
                        alignItems: 'center',
                      }}>
                      <BarIndicator size={moderateScale(26)} />
                      <Text
                        style={{
                          fontFamily: fontFamily.medium,
                          fontSize: textScale(12),
                          marginTop: moderateScaleVertical(8),
                        }}></Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={playRecording}
                      style={{
                        alignSelf: 'center',
                        alignItems: 'center',
                      }}>
                      <Image
                        style={{
                          width: moderateScale(26),
                          height: moderateScale(26),
                          resizeMode: 'contain',
                        }}
                        source={imagePath.playbuttonR}
                      />
                      <Text
                        style={{
                          fontFamily: fontFamily.medium,
                          fontSize: textScale(12),
                          marginTop: moderateScaleVertical(8),
                        }}>
                        {strings.PLAYRECORDING}
                      </Text>
                    </TouchableOpacity>
                  )
                ) : recording ? (
                  <TouchableOpacity
                    onPress={stopRecording}
                    style={{
                      alignSelf: 'center',
                      alignItems: 'center',
                    }}>
                    <Image source={imagePath.stopbutton} />
                    <Text
                      style={{
                        fontFamily: fontFamily.medium,
                        fontSize: textScale(12),
                        marginTop: moderateScaleVertical(8),
                      }}>
                      {strings.STOPRECORDING}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={startinRecording}
                    style={{
                      alignSelf: 'center',
                      alignItems: 'center',
                    }}>
                    <Image source={imagePath.microphone} />
                    <Text
                      style={{
                        fontFamily: fontFamily.medium,
                        fontSize: textScale(12),
                        marginTop: moderateScaleVertical(8),
                      }}>
                      {strings.STARTRECORDING}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={{
                  flex: 0.32,
                }}>
                {recordedPath && !isAudioUploading ? (
                  <TouchableOpacity
                    onPress={() => deleteRecording('recorded.wav')}
                    style={{
                      paddingHorizontal: moderateScale(14),
                      bottom: moderateScaleVertical(14),
                      marginHorizontal: moderateScale(10),
                    }}>
                    <Image
                      style={{
                        width: moderateScale(30),
                        height: moderateScale(30),
                        resizeMode: 'contain',
                        alignSelf: 'flex-end',
                      }}
                      source={imagePath.deleteRec}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
        <GradientButton
          indicator={bideRequestLoading}
          disabled={Number(bidRidePrice) === 0 ? true : false}
          indicatorColor={colors.white}
          colorsArray={
            Number(bidRidePrice) === 0
              ? [colors.greySearchBackground, colors.greySearchBackground]
              : [themeColors?.primary_color, themeColors?.primary_color]
          }
          textStyle={{
            textTransform: 'none',
            fontSize: textScale(12),
            color: colors.white,
          }}
          containerStyle={{
            marginTop: moderateScaleVertical(20),
          }}
          onPress={() => {
            if (recording) {
              stopRecording(true).then(res => {
                _onCreateBidRequest(res);
              });
            } else {
              _onCreateBidRequest();
            }
          }}
          btnText={strings.FINDDRIVER}
        />
      </View>
    );
  };

  const _modalClose = () => {
    updateState({
      isScheduleModalVisible: false,
    });
  };

  const _openDateTimeModal = () => {
    updateState({
      isScheduleModalVisible: true,
    });
  };

  const _selectPaymentView = () => {
    return (
      <SelectPaymentModalView
        _confirmAndPay={_confirmAndPay}
        slectedDate={
          scheduleDateTime?.slectedDate
            ? scheduleDateTime?.slectedDate
            : pickedUpDate
        }
        isModalVisible={isModalVisible}
        selectedTime={
          scheduleDateTime?.selectedTime
            ? scheduleDateTime?.selectedTime
            : pickedUpTime
        }
        date={date}
        onPressBack={() =>
          redirectFromNow
            ? updateState({showCarModal: true, showPaymentModal: false})
            : updateState({showPaymentModal: false})
        }
        totalDistance={totalDistance}
        totalDuration={totalDuration}
        selectedCarOption={selectedCarOption}
        navigation={navigation}
        couponInfo={paramData?.couponInfo}
        updatedPrice={updatedAmount}
        loyalityAmount={loyalityAmount}
        removeCoupon={() => removeCoupon()}
        pickUpTimeType={pickUpTimeType}
        redirectToPayement={() => _redirectToPayement()}
        selectedPayment={selectedPayment}
        pickup_taxi={paramData?.pickup_taxi}
        uploadImage={uploadImage}
        updateInstruction={updateInstruction}
        productFaqQuestionAnswers={selectedCarOption}
        onQuestionAnswerSubmit={item => onQuestionAnswerSubmit(item)}
        indicatorLoader={indicatorLoader}
        _openDateTimeModal={_openDateTimeModal}
        allScreenParamsData={paramData}
        distnce_unit={distance_unit_for_time}
        paymentInfoAfterBidAccept={paramData}
        couponApplied={
          Number(updatedAmount) == Number(selectedCarOption?.tags_price)
        }
        vehicleId={route?.params?.id}
        methodName={paramData?.methodName}
        serviceCharge={paramData?.serviceCharge}
        pickup={paramData?.location[0]}
        drop={paramData?.location[paramData?.location.length - 1]}
        useWalletMoney={useWalletMoney}
        setuseWalletMoney={setuseWalletMoney}
        bidDetails={route?.params?.bidData}
      />
    );
  };

  const removeCoupon = () => {
    updateState({
      updatedAmount: null,
      couponInfo: null,
    });
  };

  const _updateState = () => {
    updateState({isModalVisible: false});
    navigation.navigate(navigationStrings.CABDRIVERLOCATIONANDDETAIL, {});
  };

  const onCenter = useCallback(() => {
    if (
      paramData?.location?.length > 0 &&
      !!mapRef?.current?.fitToCoordinates
    ) {
      mapRef.current.fitToCoordinates(paramData?.location, {
        edgePadding: {
          right: 80,
          bottom: 500,
          left: 80,
          top: 80,
        },
      });
    }
  }, []);

  const onPressPickUpNow = () => {
    setIsCabBooking(false);
    setBottomSheetIndex(1);
    _onMoveNextToPaymentScreen();
  };

  const _onMoveNextToPaymentScreen = () => {
    selectedCarOption
      ? updateState({
          // pickUpTimeType: 'now',
          showPaymentModal: true,
          redirectFromNow: true,
          showCarModal: false,
        })
      : showError(strings.PLEASE_SELECT_CAR);
  };

  const renderDriverTypeMarkes = type => {
    console.log(route?.params?.id, 'dsaidsudhsu');
    if (route?.params?.id === 14 && type === 1) {
      return imagePath.taxiTopView;
    } else if (route?.params?.id === 24 && type === 2) {
      return imagePath.comfortTopView;
    } else if (route?.params?.id === 23 && type === 3) {
      return imagePath.truckTopView;
    } else if (route?.params?.id === 25 && type === 4) {
      return imagePath.towTopView;
    } else {
      return null;
    }
  };

  const VechileDetails = () => {
    return (
      <View
        style={{
          width: width,
        }}>
        <View
          style={{
            width: '90%',
            alignSelf: 'center',
            borderWidth: 1,
            borderColor: colors.borderColorB,
            height: moderateScaleVertical(200),
            marginTop: moderateScaleVertical(16),
            borderRadius: moderateScale(12),
            padding: moderateScale(16),
            flexDirection: 'row',
          }}>
          <View
            style={{
              justifyContent: 'space-between',
              marginVertical: moderateScaleVertical(14),
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  ...styles.vechilePriceName,
                  color: isDarkMode ? colors.whiteOpacity50 : colors.black,
                  fontFamily: fontFamily?.regular,
                  fontSize: textScale(16),
                  marginLeft: moderateScale(10),
                }}>
                {strings.ETIME}:
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily?.regular,
                  fontSize: textScale(16),
                }}>
                {' '}
                {Number(selectedCarOption?.duration)?.toFixed(2)}{' '}
              </Text>
              <Text
                style={{
                  ...styles.vechilePriceName,
                  color: isDarkMode ? colors.whiteOpacity50 : colors.black,
                  fontFamily: fontFamily?.regular,
                  fontSize: textScale(16),
                }}>
                {Number(selectedCarOption?.duration) > 10
                  ? strings.MINS
                  : strings.MIN}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  ...styles.vechilePriceName,
                  color: isDarkMode ? colors.whiteOpacity50 : colors.black,
                  fontFamily: fontFamily?.regular,
                  fontSize: textScale(16),
                  marginLeft: moderateScale(10),
                }}>
                {strings.DISTANCE}:
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily?.regular,
                  fontSize: textScale(16),
                }}>
                {' '}
                {selectedCarOption?.distance}{' '}
              </Text>
              <Text
                style={{
                  ...styles.vechilePriceName,
                  color: isDarkMode ? colors.whiteOpacity50 : colors.black,
                  top: moderateScaleVertical(2),
                  fontFamily: fontFamily?.regular,
                  fontSize: textScale(16),
                }}>
                {strings.KM}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: moderateScale(10),
              }}>
              <Text
                style={{
                  ...styles.vechilePriceName,
                  color: isDarkMode ? colors.whiteOpacity50 : colors.black,
                  fontFamily: fontFamily?.regular,
                  fontSize: textScale(16),
                }}>
                {strings.ESTIMATED_PRICE}:{' '}
              </Text>
              {/* <Text
                style={{
                  fontFamily: fontFamily?.bold,
                  fontSize: textScale(18),
                }}>
                {' '}
                {isEmpty(selectedCarOption?.translation)
                  ? selectedCarOption?.translation[0]?.title
                  : ''}
              </Text> */}
              <Text
                style={{
                  ...styles.vechilePriceName,
                  color: isDarkMode ? colors.whiteOpacity50 : colors.black,
                  fontSize: textScale(16),
                  fontFamily: fontFamily?.regular,
                  top:moderateScaleVertical(4)
                }}>
                {tokenConverterPlusCurrencyNumberFormater(
                  Number(selectedCarOption?.tags_price),
                  2,
                  additional_preferences,
                  currencies?.primary_currency?.symbol,
                )}
              </Text>
            </View>
          </View>
          <FastImage
            resizeMode={FastImage.resizeMode.contain}
            style={{
              height: moderateScale(86),
              width: moderateScale(86),
              right: moderateScale(20),
            }}
            source={{
              uri: selectedCarOption?.media[0]?.image?.path?.original_image,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
          />
        </View>

        {!!(showCarModal && cabBookingType != 'bidRide') && (
          <View
            style={{
              marginHorizontal: moderateScale(16),
              flexDirection: 'row',
              marginTop: moderateScaleVertical(36),
            }}>
            {availableCarList?.length > 0 && getBundleId() != appIds.appi && (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {!!scheduleDateTime?.selectedDateAndTime ? (
                  <Pressable
                    onPress={clearScheduleDate}
                    hitSlop={{
                      left: 40,
                      right: 40,
                      top: 40,
                      bottom: 40,
                    }}>
                    <Image
                      style={{
                        marginRight: moderateScale(8),
                      }}
                      source={imagePath.ic_close_circle}
                    />
                  </Pressable>
                ) : null}
                <GradientButton
                  colorsArray={[colors.white, colors.white]}
                  textStyle={{
                    textTransform: 'none',
                    fontSize: textScale(12),
                    color: themeColors?.primary_color,
                  }}
                  onPress={_openDateTimeModal}
                  btnText={`${
                    scheduleDateTime?.selectedDateAndTime
                      ? `${scheduleDateTime?.selectedDateAndTime}`
                      : slectedDate || selectedTime
                      ? `${slectedDate} ${selectedTime}`
                      : strings.SCHEDULE_A_RIDE
                  }`}
                  btnStyle={styles.scheduleBtnStyle}
                />
              </View>
            )}

            {availableCarList?.length > 0 && (
              <GradientButton
                colorsArray={[
                  themeColors.primary_color,
                  themeColors.primary_color,
                ]}
                textStyle={{
                  textTransform: 'none',

                  fontSize: textScale(12),

                  marginHorizontal: moderateScale(5),
                }}
                onPress={
                  selectedCarOption?.variant[0]?.price > 0
                    ? onPressPickUpNow
                    : () => {}
                }
                btnText={
                  selectedCarOption?.variant[0]?.price > 0
                    ? `${strings.CONFIRM} ${selectedCarOption?.translation[0]?.title}`
                    : strings.NORIDEAVAILABLE
                }
                containerStyle={{flex: 1}}
                btnStyle={{borderRadius: moderateScale(4)}}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{...styles.container}}>
      {!!paramData?.location.length > 0 && (
        <MapView
          ref={mapRef}
          provider={
            Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
          }
          customMapStyle={blueMapStyle}
          maxZoomLevel={18}
          style={{height: height / 1.25}}
          region={region}
          initialRegion={region}
          tracksViewChanges={false}>
          <CustomCallouts data={paramData?.tasks} />
          {onRoadDrivers?.map((coordinate, index) => {
            return (
              <MapCarMark
                coordinates={coordinate}
                index={index}
                imagepath={renderDriverTypeMarkes(coordinate?.vehicleType)}
              />
            );
          })}
          <MapViewDirections
            origin={paramData?.location[0]}
            waypoints={
              paramData?.location?.length > 2
                ? paramData?.location.slice(1, -1)
                : []
            }
            destination={paramData?.location[paramData?.location.length - 1]}
            apikey={profile?.preferences?.map_key}
            strokeWidth={4}
            strokeColor={colors.black}
            optimizeWaypoints={true}
            // onStart={params => {
            // }}
            precision={'high'}
            timePrecision={'now'}
            mode={'DRIVING'}
            onReady={result => {
              updateState({
                totalDistance: distance_unit_for_time
                  ? distance_unit_for_time === 'mile'
                    ? (result.distance * 0.621371).toFixed(2)
                    : result.distance.toFixed(2)
                  : result.distance.toFixed(2),
                totalDuration: result.duration.toFixed(2),
              });
            }}
            // onError={errorMessage => {
            // }}
          />
        </MapView>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={
          !isEmpty(availableCarList) && availableCarList.length <= 2
            ? bottomSheetIndex
            : 1
        }
        snapPoints={[height / 1.5, height / 1.5]}
        // activeOffsetY={[-1, 1]}
        failOffsetX={[-5, 5]}
        animateOnMount={true}
        handleComponent={carModalHeader}
        onChange={() => playHapticEffect(hapticEffects.impactMedium)}>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{
            marginBottom: moderateScaleVertical(10),
            height: height / 1.4,
            backgroundColor: isDarkMode
              ? MyDarkTheme.colors.background
              : colors.white,
          }}>
          <View
            style={{
              //  height:height/1.7,
              flex: 1,
              backgroundColor: isDarkMode
                ? MyDarkTheme.colors.background
                : colors.white,
            }}>
            {!!profile?.preferences?.is_particular_driver &&
              cabBookingType === 'Booking' &&
              !showPaymentModal && (
                <View
                  style={{
                    marginHorizontal: moderateScale(18),
                    marginBottom: moderateScaleVertical(8),
                  }}>
                  <BorderTextInputWithLable
                    marginBottom={8}
                    value={uID}
                    labelStyle={{
                      fontSize: textScale(12),
                      fontFamily: fontFamily?.regular,
                    }}
                    label={strings.REQUEST_FOR_PARTICULAR_DRIVER}
                    placeholder={strings.ENTER_DRIVER_ID}
                    onChangeText={txt => updateState({uID: txt})}
                    textInputStyle={{
                      fontSize: textScale(12),
                    }}
                    containerStyle={{
                      borderRadius: moderateScale(8),
                    }}
                  />
                </View>
              )}
            {!!showCarModal && _selectCarModalView()}
            {!!showPaymentModal && _selectPaymentView()}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      {/* BottomView */}
      <View style={styles.topView}>
        <TouchableOpacity
          style={{
            marginTop: moderateScaleVertical(34),
            height: moderateScale(40),
            width: moderateScale(40),
            borderRadius: moderateScale(16),
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() =>
            // navigation.navigate(navigationStrings.PICKUPLOCATION)
            navigation.goBack()
          }>
          <Image
            source={imagePath.backArrowCourier}
            style={{
              tintColor: colors.black,
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCenter}>
          <Image
            style={{
              width: moderateScale(34),
              height: moderateScale(34),
              borderRadius: moderateScale(34 / 2),
              marginTop: moderateScaleVertical(30),
            }}
            source={imagePath.mapNavigation}
          />
        </TouchableOpacity>
      </View>
      {isModalVisibleForPayFlutterWave && (
        <Modal
          onBackdropPress={() =>
            updateState({
              isModalVisibleForPayFlutterWave: false,
              indicatorLoader: false,
            })
          }
          isVisible={isModalVisibleForPayFlutterWave}
          style={{
            margin: 0,
            justifyContent: 'flex-end',
            // marginBottom: 20,
          }}>
          <View
            style={{
              padding: moderateScale(20),
              backgroundColor: colors?.white,
              height: height / 2,
              justifyContent: 'flex-end',
            }}>
            <PayWithFlutterwave
              onAbort={() =>
                updateState({
                  isModalVisibleForPayFlutterWave: false,
                  indicatorLoader: false,
                })
              }
              onRedirect={handleOnRedirect}
              options={{
                tx_ref: generateTransactionRef(10),
                authorization:
                  appData?.profile?.preferences?.flutterwave_public_key,
                customer: {
                  email: userData?.email,
                  name: userData?.name,
                },
                amount:
                  Number(paymentDataFlutterWave?.total_payable_amount) || 0,
                currency: currencies?.primary_currency?.iso_code,
                payment_options: 'card',
              }}
            />
          </View>
        </Modal>
      )}
      <PaymentProcessingModal
        isModalVisible={isModalVisible}
        updateModalState={_updateState}
      />

      <DatePicker
        modal
        open={isScheduleModalVisible}
        date={scheduleDateTime?.date ? scheduleDateTime?.date : new Date()}
        locale={
          languages?.primary_language?.sort_code
            ? languages?.primary_language?.sort_code
            : 'en'
        }
        mode="datetime"
        textColor={isDarkMode ? colors.black : colors.blackB}
        minimumDate={new Date()}
        style={{width: width - 20, height: height / 4.4}}
        onConfirm={date => onDateSet(date)}
        onCancel={() => updateState({isScheduleModalVisible: false})}
      />

      <BottomViewModal
        isDatetimePicker={true}
        show={showBidPriceModal}
        mainContainView={_ModalFarePriceMainView}
        closeModal={_bidModalClose}
        modalMainContainerStyle={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      <BottomViewModal
        isDatetimePicker={true}
        show={isCabBooking}
        mainContainView={VechileDetails}
        closeModal={() => setIsCabBooking(false)}
        modalMainContainerStyle={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      {!!isVisibleMtnGateway && (
        <Modal isVisible={isVisibleMtnGateway}>
          <View
            style={{
              height: moderateScaleVertical(150),
              backgroundColor: 'white',
              borderRadius: moderateScale(15),
              justifyContent: 'center',
              alignContent: 'center',
            }}>
            <Text
              style={{
                color: isDarkMode ? 'white' : themeColors?.primary_color,
                fontSize: textScale(15),
                padding: moderateScale(10),
              }}>
              Waiting for response ....
            </Text>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                padding: moderateScale(25),
              }}>
              <CountdownCircleTimer
                isPlaying
                duration={Number(responseTimer)}
                colors={[themeColors?.primary_color]}
                size={40}
                strokeWidth={5}>
                {({remainingTime}) => {
                  remainingTime == 1 &&
                    responseTimer != null &&
                    setIsVisibleMtnGateway(false);
                  var seconds = parseInt(remainingTime); //because moment js dont know to handle number in string format
                  var format =
                    moment.duration(seconds, 'seconds').minutes() +
                    ':' +
                    moment.duration(seconds, 'seconds').seconds();
                  return (
                    <>
                      <Text>{format}</Text>
                    </>
                  );
                }}
              </CountdownCircleTimer>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default gestureHandlerRootHOC(ChooseVechile);
