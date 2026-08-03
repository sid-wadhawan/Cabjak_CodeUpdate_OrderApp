import queryString from 'query-string';
import React, {useEffect, useState} from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {useDarkMode} from 'react-native-dynamic';
import {WebView} from 'react-native-webview';
import {useSelector} from 'react-redux';
import {loaderOne} from '../../Components/Loaders/AnimatedLoaderFiles';
import WrapperContainer from '../../Components/WrapperContainer';
import navigationStrings from '../../navigation/navigationStrings';
import actions from '../../redux/actions';
import colors from '../../styles/colors';
import {height, moderateScaleVertical} from '../../styles/responsiveSize';
import {MyDarkTheme} from '../../styles/theme';
import Header from '../../Components/Header';
import imagePath from '../../constants/imagePath';
import {showError, showSuccess} from '../../utils/helperFunctions';
import axios from 'axios';
import {UIActivityIndicator} from 'react-native-indicators';
import strings from '../../constants/lang';
import {useNavigation} from '@react-navigation/native';

export default function MyFatoorah({route}) {
  const navigation = useNavigation();
  let paramsData = route?.params;
  const {userData} = useSelector(state => state?.auth || {});
  console.log(paramsData, 'sffaaaaaa');
  const {themeToggle, themeColor, appStyle, appData, currencies, languages} =
    useSelector(state => state?.initBoot);
  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;

  const [state, setState] = useState({
    webData: '',
    isLoading: true,
  });

  //Update states on screens
  const updateState = data => setState(state => ({...state, ...data}));
  const {webData, isLoading} = state;

  useEffect(() => {
    apiHit();
  }, []);
  const apiHit = async () => {
    let payableamount = paramsData?.total_payable_amount;
    // if (!!paramsData?.serviceCharge) {
    //   payableamount =
    //     Number(paramsData?.orderDetail?.payable_amount) +
    //     Number(paramsData?.serviceCharge);
    // }
    updateState({isLoading: true});
    let queryData = `/${paramsData?.selectedPayment?.code?.toLowerCase()}?amount=${payableamount}&payment_option_id=${
      paramsData?.payment_option_id
    }&action=${paramsData?.redirectFrom}&order_number=${
      paramsData?.orderDetail?.order_number
    }&come_from=app&PaymentMethodId=${
      paramsData?.selectedPayid
    }&ServiceCharge=${paramsData?.serviceCharge}`;

    console.log(queryData, 'queryDataqueryData');
    try {
      const res = await actions.openPaymentWebUrl(
        queryData,
        {},
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      );
      updateState({webData: res?.Data?.PaymentURL, isLoading: false});
    } catch (error) {
      console.log(error, 'ererrerrererrere');
      updateState({isLoading: false});
      showError(error.message || error);
    }
  };

  const paymentReponse = res => {
    console.log(res, 'reserseersers');
    axios({
      method: 'POST',
      url: res,
      body: {
        order_number: paramsData?.orderDetail?.order_number,
        // 'come_from': "app"
      },
      headers: {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
        authorization: `${userData.auth_token}`,
      },
    })
      .then(response => {
        console.log(response, 'response------>>>>');
        // navigation.goBack()
      })
      .catch(error => {
        console.log(error, 'error-->>>');
      });
  };
  const moveToNewScreen =
    (screenName, data = {}) =>
    () => {
      navigation.navigate(screenName, {data});
    };

  const onNavigationStateChange = props => {
    const {url} = props;
    const URL = queryString.parseUrl(url);
    const queryParams = URL.query;
    const nonQueryURL = URL.url;
    console.log(url,'gyyyggyy')
    setTimeout(() => {
      if (url.includes('/paymentcancel')) {
        navigation.goBack();
        showError(strings.CANCELLED);
        return;
      }
      if (queryParams.status == 200) {
        if (paramsData?.redirectFrom === 'pay_after_order') {
          showSuccess(strings.PAYMENT_SUCCESS);
          navigation.goBack();
          return;
        }

        if (paramsData?.extraData) {
          navigation.navigate(
            navigationStrings.PICKUPTAXIORDERDETAILS,
            paramsData?.extraData,
          );
        } else {
          moveToNewScreen(navigationStrings.ORDERSUCESS, {
            orderDetail: {
              order_number: queryParams.order,
              id: paramsData?.orderDetail?.id,
            },
          })();
        }
      } else if (queryParams.status == 0) {
        if (paramsData?.extraData) {
          navigation.goBack();
        } else {
          moveToNewScreen(navigationStrings.CART, {
            queryURL: url.replace(`${nonQueryURL}?`, ''),
          })();
        }
      }
    }, 500);
  };

  return (
    <WrapperContainer
      bgColor={isDarkMode ? MyDarkTheme.colors.background : colors.transparent}
      statusBarColor={colors.white}
      source={loaderOne}
      isLoadingB={isLoading}>
      <Header
        leftIcon={
          appStyle?.homePageLayout === 3 || appStyle?.homePageLayout === 5
            ? imagePath.icBackb
            : imagePath.back
        }
        centerTitle={
          !!paramsData?.methodName
            ? paramsData?.methodName
            : paramsData?.selectedPayment?.title || paramsData?.walletTip?.title
        }
        headerStyle={{backgroundColor: colors.white}}
      />
      {webData !== '' ? (
        <WebView
          showsVerticalScrollIndicator={false}
          source={{
            uri: webData,
            method: 'GET',
            body: queryString.stringify(webData?.formData),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          }}
          onNavigationStateChange={onNavigationStateChange}
          onLoad={() => updateState({isLoading: true})}
        />
      ) : (
        <View
          style={{
            height: height / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <UIActivityIndicator color={colors.themeColor} size={32} />
        </View>
      )}
    </WrapperContainer>
  );
}

const styles = StyleSheet.create({});
