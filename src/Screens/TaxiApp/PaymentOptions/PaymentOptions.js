import {createToken} from '@stripe/stripe-react-native';
import {isEmpty} from 'lodash';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  I18nManager,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDarkMode} from 'react-native-dynamic';
import FastImage from 'react-native-fast-image';
import {enableFreeze} from 'react-native-screens';
import {useSelector} from 'react-redux';
import GradientButton from '../../../Components/GradientButton';
import Header from '../../../Components/Header';
import PaymentGateways from '../../../Components/PaymentGateways';
import WrapperContainer from '../../../Components/WrapperContainer';
import imagePath from '../../../constants/imagePath';
import {BarIndicator} from 'react-native-indicators';

import strings from '../../../constants/lang';
import navigationStrings from '../../../navigation/navigationStrings';
import actions from '../../../redux/actions';
import colors from '../../../styles/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../../styles/responsiveSize';
import {MyDarkTheme} from '../../../styles/theme';
import {showError, showSuccess} from '../../../utils/helperFunctions';
import stylesFun from './styles';
enableFreeze(true);

const PaymentOptions = ({navigation, route}) => {
  const [state, setState] = useState({
    pageNo: 1,
    limit: 12,
    apiPaymentOptions: [],
    walletPayment: {id: 2, title: strings.WALLET, off_site: 0},
    selectedPaymentMethod: null,
    cardInfo: null,
    btnLoader: false,
    cardFill: true,
    savedCardData: [],
    selectedSavedListCardNumber: null,
    wallet_amount,
  });

  const {appData, appStyle, themeColors, currencies, languages} = useSelector(
    state => state.initBoot,
  );
  const {profile} = appData;
  const [year, setYear] = useState();
  const [date, setDate] = useState();
  const [isLoading, setisLoading] = useState(false);
  const [accept, isAccept] = useState(false);
  const theme = useSelector(state => state?.initBoot?.themeColor);
  const toggleTheme = useSelector(state => state?.initBoot?.themeToggle);
  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = toggleTheme ? darkthemeusingDevice : theme;
  const paramData = route?.params?.data?.paramData;
  const walletAmount = useSelector(
    state => state?.product?.walletData?.wallet_amount,
  );

  const updateState = data => setState(state => ({...state, ...data}));
  const fontFamily = appStyle?.fontSizeData;
  const styles = stylesFun({fontFamily, themeColors});
  const [cardNumber, setCardNUmber] = useState();
  const [cvc, setCvc] = useState();
  const [expiryDate, setExpiryDate] = useState();
  const {
    pageNo,
    limit,
    apiPaymentOptions,
    walletPayment,
    selectedPaymentMethod,
    cardInfo,
    btnLoader,
    cardFill,
    savedCardData,
    selectedSavedListCardNumber,
    wallet_amount,
  } = state;

  useEffect(() => {
    getAllPaymentOptions();
  }, []);

  useEffect(() => {
    getWalletData();
  }, [pageNo]);

  const getSavedCardList = () => {
    actions
      .getSavedCardsList(
        {},
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      )
      .then(res => {
        console.log('getSavedCardList =>', res);
        updateState({isLoading: false, isRefreshing: false});
        if (res && res?.data) {
          updateState({savedCardData: res?.data});
        }
      })
      .catch(errorMethod);
  };

  const getAllPaymentOptions = () => {
    setisLoading(true);
    actions
      .getListOfPaymentMethod(
        route?.params?.screenName === strings.DETAILS
          ? `/postpay/`
          : !!route?.params?.data?.currentAmount
          ? `/pickup_delivery?amount=${route?.params?.data?.currentAmount}`
          : `/pickup_delivery/`,
        {},
        {
          code: appData?.profile?.code,
        },
      )
      .then(res => {
        console.log(res, 'responseFromServer');
        updateState({
          apiPaymentOptions: res?.data,
        });
        setisLoading(false);

        {
          !isEmpty(res?.data) &&
            res?.data.map((item, index) => {
              item.id == 50 && getSavedCardList();
            });
        }
      })
      .catch(errorMethod);
  };
  const checkInputHandler = (type, data) => {
    if (type === 'Card Number') {
      let re = data
        .replace(/\s?/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
      setCardNUmber(re);
    }
    if (type === 'ExpiryDate') {
      let ed = data
        .replace(
          /^([1-9]\/|[2-9])$/g,
          '0$1/', // To handle 3/ > 03/
        )
        .replace(
          /^(0[1-9]{1}|1[0-2]{1})$/g,
          '$1/', // 11 > 11/
        )
        .replace(
          /^([0-1]{1})([3-9]{1})$/g,
          '0$1/$2', // 13 > 01/3
        )
        .replace(
          /^(\d)\/(\d\d)$/g,
          '0$1/$2', // To handle 1/11 > 01/11
        )
        .replace(
          /^(0?[1-9]{1}|1[0-2]{1})([0-9]{2})$/g,
          '$1/$2', // 141 > 01/41
        )
        .replace(
          /^([0]{1,})\/|[0]{1,}$/g,
          '0', // To handle 0/ > 0 and 00 > 0
        )
        .replace(
          /[^\d\/]|^[\/]{0,}$/g,
          '', // To allow only numbers and /
        )
        .replace(/\/\//g, '/')
        .trim();
      setExpiryDate(ed);
    }
    if (type === 'CVC') {
      setCvc(data);
    }
    if (type === 'Year') {
      let year = data.replace(/^\d{5}$/).trim();
      setYear(year);
    }
    if (type === 'Date') {
      let year = data.replace(/^([1-9]\/|[2-9])$/g, '0$1').trim();
      setDate(year);
    }
  };

  const deleteCard = item => {
    Alert.alert('', strings.DELETE_CARD, [
      {
        text: strings.CANCEL,
        onPress: () => console.log('Cancel Pressed'),
        // style: 'destructive',
      },
      {
        text: strings.CONFIRM,
        onPress: () => {
          deleteSaveCard(item);
        },
      },
    ]);
  };
  const deleteSaveCard = item => {
    let query = `?id=${item?.id}`;
    actions
      .deleteCard(
        query,
        {},
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      )
      .then(res => {
        console.log(res, 'resereserseersre');
        alert(res?.message);
        getSavedCardList();
      })
      .catch(err => {
        console.log(err, 'errorrrrrrrrrr');
      });
  };

  const _isCheck = () => {
    isAccept(!accept);
  };

  const selectSavedCard = (data, inx) => {
    {
      selectedSavedListCardNumber && selectedSavedListCardNumber?.id == data?.id
        ? updateState({selectedSavedListCardNumber: null})
        : updateState({selectedSavedListCardNumber: data});
    }
  };
  const renderSavedCardList = ({item, index}) => {
    console.log('renderSavedCardList =>', index);
    const expDate = item?.expiration;
    // const expDate = item?.expiration.slice(0, 4) + "/" + item?.expiration.slice(4)
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          onPress={() => selectSavedCard(item, index)}
          style={{
            marginVertical: moderateScaleVertical(8),
            borderRadius: moderateScaleVertical(13),
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          <Image
            source={
              selectedSavedListCardNumber &&
              selectedSavedListCardNumber?.id == item.id
                ? imagePath.radioActive
                : imagePath.radioInActive
            }
          />
          <View style={{marginLeft: moderateScale(10)}}>
            <View style={{flexDirection: 'row'}}>
              <Text
                style={
                  isDarkMode
                    ? [
                        styles.caseOnDeliveryText,
                        {color: MyDarkTheme.colors.text},
                      ]
                    : styles.caseOnDeliveryText
                }>
                {'Card No:'}
              </Text>
              <Text
                style={
                  isDarkMode
                    ? [
                        styles.caseOnDeliveryText,
                        {color: MyDarkTheme.colors.text},
                      ]
                    : styles.caseOnDeliveryText
                }>
                {item?.card_hint}
              </Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <Text
                style={
                  isDarkMode
                    ? [
                        styles.caseOnDeliveryText,
                        {color: MyDarkTheme.colors.text},
                      ]
                    : styles.caseOnDeliveryText
                }>
                {'Exp Date:'}
              </Text>
              <Text
                style={
                  isDarkMode
                    ? [
                        styles.caseOnDeliveryText,
                        {color: MyDarkTheme.colors.text},
                      ]
                    : styles.caseOnDeliveryText
                }>
                {expDate}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteCard(item)}>
          <Image source={imagePath?.delete} />
        </TouchableOpacity>
      </View>
    );
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
        updateState({
          isRefreshing: false,
          isLoading: false,
          isLoadingB: false,
          wallet_amount: res?.data?.wallet_amount,
          walletHistory:
            pageNo == 1
              ? res.data.transactions.data
              : [...walletHistory, ...res.data.transactions.data],
        });
      })
      .catch(errorMethod);
  };
  const errorMethod = error => {
    setisLoading(false);
    updateState({isLoading: false, isLoadingB: false, isRefreshing: false});
    showError(error?.message || error?.error);
  };

  const _onPressWallet = () => {
    if (walletAmount >= 0) {
      navigation.navigate(navigationStrings.CHOOSECARTYPEANDTIMETAXI, {
        ...paramData,
        selectedMethod: walletPayment,
      });
    } else {
      showError(strings.PLEASE_RECHARGE_WALLET);
    }
  };

  const _onPressPaymentOption = (
    item,
    secondPayId,
    methodName,
    serviceCharge,
  ) => {
    updateState({selectedPaymentMethod: item});

    if (item?.id == 4) {
      return;
    }
    if (item?.id == 49 || item?.id == 50 || item?.id == 53) {
      return;
    }
    navigation.navigate(navigationStrings.CHOOSECARTYPEANDTIMETAXI, {
      ...paramData,
      selectedMethod: item,
      secondPaymentId: secondPayId,
      methodName: methodName,
      serviceCharge: serviceCharge,
    });
  };

  const selectPaymentOption = async () => {
    if (
      selectedPaymentMethod?.id == 4 &&
      selectedPaymentMethod?.off_site == 0
    ) {
      updateState({btnLoader: true});
      if (cardInfo) {
        console.log(cardInfo, 'cardInfo>>>');
        await createToken({...cardInfo, type: 'Card'})
          .then(res => {
            updateState({btnLoader: false});
            console.log(res, 'res>>>>>');
            if (!!res?.error) {
              alert(res.error.localizedMessage);
              return;
            }
            navigation.navigate(navigationStrings.CHOOSECARTYPEANDTIMETAXI, {
              ...paramData,
              cardInfo: cardInfo,
              tokenInfo: res.token?.id,
              selectedMethod: selectedPaymentMethod,
            });
          })
          .catch(err => {
            updateState({btnLoader: false});
            console.log(err, 'err>>');
          });
      } else {
        updateState({btnLoader: false});
        alert(strings.NOT_ADDED_CART_DETAIL_FOR_PAYMENT_METHOD);
        //   showError(strings.NOT_ADDED_CART_DETAIL_FOR_PAYMENT_METHOD);
      }
    } else if (
      (selectedPaymentMethod?.id == 49 ||
        selectedPaymentMethod?.id == 50 ||
        selectedPaymentMethod?.id == 53) &&
      selectedPaymentMethod?.off_site == 1
    ) {
      if (!isEmpty(selectedSavedListCardNumber)) {
        navigation.navigate(navigationStrings.CHOOSECARTYPEANDTIMETAXI, {
          ...paramData,

          selectedMethod: selectedPaymentMethod,
          selectedSavedListCardNumber: selectedSavedListCardNumber,
        });
      }
      if (cardNumber && cvc && (expiryDate || (year && date))) {
        navigation.navigate(navigationStrings.CHOOSECARTYPEANDTIMETAXI, {
          ...paramData,
          Card_Number: cardNumber,
          cvc: cvc,
          expiryDate: expiryDate,
          selectedMethod: selectedPaymentMethod,
          year: year,
          date: date,
          saveCardDetails: accept,
        });
      }
    }
  };

  const _onChangeStripeData = cardDetails => {
    console.log(cardDetails, 'cardDetails>>>');
    if (cardDetails?.complete) {
      updateState({
        cardInfo: {
          brand: cardDetails.brand,
          complete: true,
          expiryMonth: cardDetails?.expiryMonth,
          expiryYear: cardDetails?.expiryYear,
          last4: cardDetails?.last4,
          postalCode: cardDetails?.postalCode,
        },
      });
    } else {
      updateState({cardInfo: null});
    }
  };

  const _renderItem = ({item}) => {
    return item?.id !== 64 && item?.id !== 69 ? (
      <TouchableOpacity
        onPress={() => {
          if (route?.params?.screenName === strings.DETAILS) {
            updateState({isLoading: true, isRefreshing: true});

            actions
              .postpayCashWallet(
                {
                  payment_option_id: item?.id,
                  order_number: route?.params?.data?.orderid,
                },
                {
                  code: appData?.profile?.code,
                  currency: currencies?.primary_currency?.id,
                  language: languages?.primary_language?.id,
                },
              )
              .then(res => {
                updateState({isLoading: false, isRefreshing: false});
                if (res?.message === 'Order paid successfully') {
                  showSuccess(strings.PAID_AMOUNT);
                  setTimeout(() => {
                    navigation.goBack();
                  }, 800);
                }
              })
              .catch(errorMethod);
          } else {
            _onPressPaymentOption(item);
          }
        }}
        style={[
          styles.renderItemStyle,
          {
            borderRadius: moderateScale(16),
            padding: moderateScale(14),
            marginBottom: moderateScale(12),
            backgroundColor: '#fff',
            borderWidth: 0.2,
            borderColor: '#E0E0E0',
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: {width: 0, height: 3},
            shadowRadius: 6,
            elevation: 2,
          },
        ]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {/* Radio indicator */}
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#999',
              alignItems: 'center',
              justifyContent: 'center',
            }}></View>

          {/* Payment Logo */}
          <FastImage
            source={imagePath.cashpay}
            resizeMode="contain"
            style={{
              width: moderateScale(42),
              height: moderateScale(42),
              marginStart: moderateScale(12),
            }}
          />

          {/* Name & Charges */}
          <View style={{flex: 1}}>
            <Text
              style={{
                color: isDarkMode ? MyDarkTheme.colors.text : '#1C1C1C',
                fontSize: textScale(13),
                fontFamily: fontFamily.medium,
                marginStart: moderateScale(12),
              }}>
              {item?.id == 1 ? strings.CASHPAYMENT : item.title}
            </Text>
          </View>
        </View>

        {/* {!!(
        isSelected &&
        selectedPaymentMethod?.off_site == 0 &&
        selectedPaymentMethod?.id === 4
      ) && (
        <StripeProvider
          publishableKey={appData?.profile?.preferences?.stripe_publishable_key}
          merchantIdentifier="merchant.identifier">
          <CardField
            postalCodeEnabled={false}
            placeholder={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: colors.backgroundGrey,
              textColor: colors.black,
              borderRadius: 8,
            }}
            style={{
              width: '100%',
              height: 50,
              marginVertical: 10,
            }}
            onCardChange={_onChangeStripeData}
            onBlur={() => Keyboard.dismiss()}
          />
        </StripeProvider>
      )} */}

        {/* PaymentGateways UI */}
        {/* {!!(
        isSelected &&
        selectedPaymentMethod?.off_site == 1 &&
        [49, 50, 53].includes(selectedPaymentMethod?.id)
      ) && (
        <PaymentGateways
          isCardNumber={cardNumber}
          cvc={cvc}
          expiryDate={expiryDate}
          year={year}
          onChangeExpiryDateText={data => checkInputHandler('ExpiryDate', data)}
          onChangeText={data => checkInputHandler('Card Number', data)}
          onChangeCvcText={data => checkInputHandler('CVC', data)}
          onChangeYearText={data => checkInputHandler('Year', data)}
          onChangeDateText={data => checkInputHandler('Date', data)}
          paymentid={selectedPaymentMethod?.id}
          eDate={date}
        />
      )} */}
      </TouchableOpacity>
    ) : null;
  };

  const toFixedTruncate = (value, digits = 1000) => {
    return Math.trunc(value * digits) / digits;
  };

  const _renderItemSecond = ({item}) => {
    const baseAmount = Number(route?.params?.data?.currentAmount);
    let finalSerivceCharge;
    let grossExact;
    let newGrossExact;
    let grossRounded;
    let newgrossRounded;
    let methodName = I18nManager.isRTL
      ? item?.PaymentMethodId === 26
        ? 'جوجل باي'
        : item?.PaymentMethodAr
      : item?.PaymentMethodEn;

    //CALCULATING SERVICE CHARGES LOGIC
    if (item?.PaymentCurrencyIso === 'KWD') {
      switch (item?.PaymentMethodCode) {
        case 'kn':
          grossExact = baseAmount / 0.99 + 0.1;
          newGrossExact = toFixedTruncate(grossExact);
          grossRounded = Math.ceil(newGrossExact * 100) / 100;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount);
          finalSerivceCharge = Math.round(newgrossRounded * 100) / 100;

          break;

        case 'vm':
          grossExact = baseAmount / 0.975;
          newGrossExact = toFixedTruncate(grossExact);
          grossRounded = Math.ceil(newGrossExact * 100) / 100;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount);
          finalSerivceCharge = Math.round(newgrossRounded * 100) / 100;
          break;

        case 'ap':
          grossExact = baseAmount / 0.99 + 0.12;
          newGrossExact = toFixedTruncate(grossExact);
          grossRounded = Math.ceil(newGrossExact * 100) / 100;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount);
          finalSerivceCharge = Math.round(newgrossRounded * 100) / 100;
          break;

        case 'gp':
          grossExact = baseAmount / 0.975;
          newGrossExact = toFixedTruncate(grossExact);
          grossRounded = Math.ceil(newGrossExact * 100) / 100;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount);
          finalSerivceCharge = Math.round(newgrossRounded * 100) / 100;
          break;

        default:
          finalSerivceCharge = item?.ServiceCharge || 0;
          break;
      }
    } else if (item?.PaymentCurrencyIso === 'SAR') {
      switch (item?.PaymentMethodId) {
        //VISA/MASTER
        case 2:
          grossExact = baseAmount / 0.977 + 1;
          newGrossExact = toFixedTruncate(grossExact, 100);
          grossRounded = Math.ceil(newGrossExact * 10) / 10;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount, 100);
          finalSerivceCharge = Math.round(newgrossRounded * 10) / 10;
          break;

        //MADA
        case 6:
          grossExact = baseAmount / 0.991;
          newGrossExact = toFixedTruncate(grossExact, 100);
          grossRounded = Math.ceil(newGrossExact * 10) / 10;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount, 100);
          finalSerivceCharge = Math.round(newgrossRounded * 10) / 10;

          break;

        //APPLE PAY
        case 11:
          grossExact = baseAmount / 0.977 + 1;
          newGrossExact = toFixedTruncate(grossExact, 100);
          grossRounded = Math.ceil(newGrossExact * 10) / 10;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount, 100);
          finalSerivceCharge = Math.round(newgrossRounded * 10) / 10;
          break;

        //STC PAY
        case 12:
          grossExact = baseAmount / 0.991;
          newGrossExact = toFixedTruncate(grossExact, 100);
          grossRounded = Math.ceil(newGrossExact * 10) / 10;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount, 100);
          finalSerivceCharge = Math.round(newgrossRounded * 10) / 10;
          break;

        //APPLE PAY MADA
        case 13:
          grossExact = baseAmount / 0.991;
          newGrossExact = toFixedTruncate(grossExact, 100);
          grossRounded = Math.ceil(newGrossExact * 10) / 10;
          newgrossRounded = toFixedTruncate(grossRounded - baseAmount, 100);
          finalSerivceCharge = Math.round(newgrossRounded * 10) / 10;
          break;

        default:
          finalSerivceCharge = item?.ServiceCharge || 0;
          break;
      }
    }

    console.log(
      grossExact,
      '\n',
      newGrossExact,
      '\n',
      grossRounded,
      '\n',
      newgrossRounded,
      '\n',
      finalSerivceCharge,
      'item?.fddfdffdddffdfd',
      item?.PaymentMethodId,
    );

    return Platform.OS === 'android' &&
      item?.PaymentMethodEn?.toLowerCase().includes('apple') ? (
      <></>
    ) : (
      <TouchableOpacity
        onPress={() => {
          if (route?.params?.screenName === strings.DETAILS) {
            navigation.navigate(navigationStrings.MYFATOORAH, {
              total_payable_amount: baseAmount + finalSerivceCharge,
              payment_option_id: apiPaymentOptions[0]?.id,
              redirectFrom: 'pay_after_order',
              selectedPayment: {code: apiPaymentOptions[0]?.code},
              selectedPayid: item?.PaymentMethodId,
              serviceCharge: finalSerivceCharge,
              orderDetail: {order_number: route?.params?.data?.orderid},
            });
          } else {
            _onPressPaymentOption(
              apiPaymentOptions[1],
              item?.PaymentMethodId,
              methodName,
              finalSerivceCharge,
            );
          }
        }}
        style={[
          styles.renderItemStyle,
          {
            borderRadius: moderateScale(16),
            padding: moderateScale(14),
            marginBottom: moderateScale(14),
            backgroundColor: '#fff',
            borderWidth: 0.2,
            borderColor: '#E0E0E0',
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: {width: 0, height: 3},
            shadowRadius: 6,
            elevation: 2,
          },
        ]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {/* Radio indicator */}
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#999',
              alignItems: 'center',
              justifyContent: 'center',
            }}></View>

          {/* Payment Logo */}
          <FastImage
            source={{uri: item?.ImageUrl}}
            resizeMode="contain"
            style={{
              width: moderateScale(42),
              height: moderateScale(42),
              marginStart: moderateScale(12),
            }}
          />

          {/* Name & Charges */}
          <View style={{flex: 1}}>
            <Text
              style={{
                color: isDarkMode ? MyDarkTheme.colors.text : '#1C1C1C',
                fontSize: textScale(13),
                fontFamily: fontFamily.medium,
                marginStart: moderateScale(12),
                textTransform: 'capitalize',
              }}>
              {methodName}
            </Text>
            {!!item?.ServiceCharge && (
              <Text
                style={{
                  fontSize: textScale(11),
                  fontFamily: fontFamily.regular,
                  marginStart: moderateScale(14),
                  color: colors.blackOpacity86,
                  marginTop: moderateScaleVertical(2),
                }}>
                {`${strings.EXTRAP} ${finalSerivceCharge} ${strings.FEESAPPY}`}
              </Text>
            )}
          </View>
        </View>

        {/* Stripe UI */}
        {/* {!!(
        isSelected &&
        selectedPaymentMethod?.off_site == 0 &&
        selectedPaymentMethod?.id === 4
      ) && (
        <StripeProvider
          publishableKey={appData?.profile?.preferences?.stripe_publishable_key}
          merchantIdentifier="merchant.identifier">
          <CardField
            postalCodeEnabled={false}
            placeholder={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: colors.backgroundGrey,
              textColor: colors.black,
              borderRadius: 8,
            }}
            style={{
              width: '100%',
              height: 50,
              marginVertical: 10,
            }}
            onCardChange={_onChangeStripeData}
            onBlur={() => Keyboard.dismiss()}
          />
        </StripeProvider>
      )} */}

        {/* PaymentGateways UI */}
        {/* {!!(
        isSelected &&
        selectedPaymentMethod?.off_site == 1 &&
        [49, 50, 53].includes(selectedPaymentMethod?.id)
      ) && (
        <PaymentGateways
          isCardNumber={cardNumber}
          cvc={cvc}
          expiryDate={expiryDate}
          year={year}
          onChangeExpiryDateText={data => checkInputHandler('ExpiryDate', data)}
          onChangeText={data => checkInputHandler('Card Number', data)}
          onChangeCvcText={data => checkInputHandler('CVC', data)}
          onChangeYearText={data => checkInputHandler('Year', data)}
          onChangeDateText={data => checkInputHandler('Date', data)}
          paymentid={selectedPaymentMethod?.id}
          eDate={date}
        />
      )} */}
      </TouchableOpacity>
    );
  };

  const postPayviaWallet = () => {
    if (route?.params?.screenName === strings.DETAILS) {
      updateState({isLoading: true, isRefreshing: true});

      actions
        .postpayCashWallet(
          {
            payment_option_id: 1,
            order_number: route?.params?.data?.orderid,
            type: 'wallet',
          },
          {
            code: appData?.profile?.code,
            currency: currencies?.primary_currency?.id,
            language: languages?.primary_language?.id,
          },
        )
        .then(res => {
          updateState({
            isLoading: false,
            isRefreshing: false,
          });
          if (res?.message === 'Order paid successfully') {
            navigation.goBack();
            showSuccess(strings.PAID_AMOUNT);
          }
        })
        .catch(errorMethod);
    }
  };

  return (
    <WrapperContainer
      bgColor={isDarkMode ? MyDarkTheme.colors.background : colors.white}
      statusBarColor={colors.white}>
      <Header
        rightViewStyle={{
          backgroundColor: isDarkMode
            ? MyDarkTheme.colors.lightDark
            : colors.backgroundGrey,
          alignItems: 'center',
          paddingVertical: moderateScaleVertical(8),
          borderRadius: 14,
          flex: 0.15,
        }}
        leftIcon={imagePath.backArrowCourier}
        centerTitle={strings.PAYMENT_OPTIONS}
        headerStyle={{
          backgroundColor: isDarkMode
            ? MyDarkTheme.colors.background
            : colors.white,
          marginVertical: moderateScaleVertical(10),
          rightViewStyle: {backgroundColor: colors.greyColor},
        }}
      />
      <View style={styles.containerStyle}>
        <View style={{marginHorizontal: moderateScale(18)}}>
          <Text
            style={{
              opacity: 0.7,
              fontFamily: fontFamily.bold,
              fontSize: textScale(14),
              color: isDarkMode ? MyDarkTheme.colors.text : colors.black,
              marginTop: moderateScaleVertical(20),
              marginBottom: moderateScaleVertical(12),
              marginLeft: moderateScale(6),
            }}>
            {strings.PAYMENT_METHOD}
          </Text>
          {/* {walletAmount > 0 && (
            <TouchableOpacity
              onPress={_onPressWallet}
              style={{
                ...styles.renderItemStyle,
                flexDirection: 'row',
                // marginBottom: moderateScale(20),
              }}>
              <Image
                source={imagePath.radioInActive}
                style={styles.imageStyle}
              />
              <Text
                style={[
                  styles.textStyle,
                  {color: isDarkMode ? MyDarkTheme.colors.text : '#1C1C1C'},
                ]}>
                {strings.WALLET} ({walletAmount})
              </Text>
            </TouchableOpacity>
          )} */}

          {!isLoading ? (
            <>
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}>
                <FlatList
                  bounces={false}
                  data={apiPaymentOptions || []}
                  renderItem={_renderItem}
                  keyExtractor={(item, index) => String(index)}
                />
                {route?.params?.screenName === strings.DETAILS &&
                Number(route?.params?.data?.currentAmount) <=
                  Number(wallet_amount) ? (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(strings.ALERT, strings.WANTTOPAYWALLET, [
                        {
                          text: strings.YES,
                          onPress: () => postPayviaWallet(),
                          style: 'default',
                        },
                        {text: strings.NO, style: 'cancel'},
                      ]);
                    }}
                    style={[
                      styles.renderItemStyle,
                      {
                        borderRadius: moderateScale(16),
                        padding: moderateScale(14),
                        marginBottom: moderateScale(12),
                        backgroundColor: '#fff',
                        borderWidth: 0.2,
                        borderColor: '#E0E0E0',
                        shadowColor: '#000',
                        shadowOpacity: 0.06,
                        shadowOffset: {width: 0, height: 3},
                        shadowRadius: 6,
                        elevation: 2,
                      },
                    ]}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      {/* Radio indicator */}
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: '#999',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}></View>

                      {/* Payment Logo */}
                      <FastImage
                        source={imagePath.wallet3}
                        resizeMode="contain"
                        tintColor={colors.themeGreen}
                        style={{
                          width: moderateScale(40),
                          height: moderateScale(40),
                          marginStart: moderateScale(12),
                        }}
                      />

                      {/* Name & Charges */}
                      <View style={{flex: 1}}>
                        <Text
                          style={{
                            color: isDarkMode
                              ? MyDarkTheme.colors.text
                              : '#1C1C1C',
                            fontSize: textScale(13),
                            fontFamily: fontFamily.medium,
                            marginStart: moderateScale(12),
                          }}>
                          {strings.WALLET}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : null}
                <FlatList
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  data={[
                    ...(apiPaymentOptions[0]?.paymentList?.Data
                      ?.PaymentMethods || []),
                    ...(apiPaymentOptions[1]?.paymentList?.Data
                      ?.PaymentMethods || []),
                    ...(apiPaymentOptions[2]?.paymentList?.Data
                      ?.PaymentMethods || []),
                  ]}
                  renderItem={_renderItemSecond}
                  keyExtractor={(item, index) => String(index)}
                  ListHeaderComponent={() => (
                    <View style={{marginLeft: moderateScale(6)}}>
                      <Text
                        style={{
                          opacity: 0.7,
                          fontFamily: fontFamily.bold,
                          fontSize: textScale(14),
                          color: isDarkMode
                            ? MyDarkTheme.colors.text
                            : colors.black,
                          marginTop: moderateScaleVertical(10),
                        }}>
                        {strings.SECUREONLINE}
                      </Text>
                      <Text
                        style={{
                          opacity: 0.7,
                          fontFamily: fontFamily.bold,
                          fontSize: textScale(10),
                          color: isDarkMode
                            ? MyDarkTheme.colors.text
                            : colors.redFireBrick,
                          marginTop: moderateScaleVertical(2),
                          marginBottom: moderateScaleVertical(16),
                        }}>
                        ({strings.CHARGESAPPY})
                      </Text>
                    </View>
                  )}
                  ListFooterComponent={() => (
                    <View style={{height: moderateScaleVertical(100)}} />
                  )}
                />
              </ScrollView>
            </>
          ) : (
            <BarIndicator
              color={colors.themeColor}
              size={moderateScale(24)}
              style={{marginTop: moderateScaleVertical(90)}}
            />
          )}
        </View>
        {(selectedPaymentMethod?.id == 4 ||
          selectedPaymentMethod?.id == 49 ||
          selectedPaymentMethod?.id == 50 ||
          selectedPaymentMethod?.id == 53) && (
          <GradientButton
            onPress={selectPaymentOption}
            containerStyle={{
              position: 'absolute',
              bottom: 0,
              width: width - moderateScale(40),
              alignSelf: 'center',
            }}
            marginTop={moderateScaleVertical(10)}
            marginBottom={moderateScaleVertical(10)}
            btnText={strings.SELECT}
            indicator={btnLoader}
            indicatorColor={colors.white}
          />
        )}
      </View>
    </WrapperContainer>
  );
};

export default PaymentOptions;
