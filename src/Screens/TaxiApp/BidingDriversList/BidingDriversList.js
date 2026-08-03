import {isEmpty} from 'lodash';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDarkMode} from 'react-native-dynamic';
import {UIActivityIndicator} from 'react-native-indicators';
import Sound from 'react-native-sound';
import {useSelector} from 'react-redux';
import BidAcceptRejectCard from '../../../Components/BidAcceptRejectCard';
import Header from '../../../Components/Header';
import WrapperContainer from '../../../Components/WrapperContainer';
import imagePath from '../../../constants/imagePath';
import strings from '../../../constants/lang';
import navigationStrings from '../../../navigation/navigationStrings';
import actions from '../../../redux/actions';
import colors from '../../../styles/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../../styles/responsiveSize';
import {MyDarkTheme} from '../../../styles/theme';
import {showError} from '../../../utils/helperFunctions';

export default function BidingDriversList(props) {
  const {route, navigation} = props;
  const {lastBidInfo} = useSelector(state => state?.home);

  const paramData = route?.params?.data?.paramData || lastBidInfo?.bidData;
  const {
    appData,
    currencies,
    languages,
    themeColors,
    appStyle,
    themeToggle,
    themeColor,
  } = useSelector(state => state?.initBoot);
  const {notificationForBide} = useSelector(state => state?.order);

  const fontFamily = appStyle?.fontSizeData;
  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;
  const [allDriverBidesList, setAllDriverBidesList] = useState([]);
  const [bidExpiryTime, setBidExpiryTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setaudioLoading] = useState(false);
  const [placeBidLoader, setplaceBidLoader] = useState(false);
  let endDate = new Date(lastBidInfo?.expiryTime);
  let startDate = new Date();
  const soundRef = useRef(null);

  useEffect(() => {
    _onOrderBidRideDetails();
  }, [notificationForBide, allDriverBidesList]);

  useEffect(() => {
    let timeDiffInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
    if (bidExpiryTime != 0 || (timeDiffInSeconds > 0 )) {
      let timer = setTimeout(
        () => {
          if (isEmpty(allDriverBidesList)) {
            // onPressLeft(true);
          }
        },
        !!lastBidInfo
          ? timeDiffInSeconds * 1000
          : Number(Number(bidExpiryTime) * 1000),
      );
      return () => clearTimeout(timer);
    }
  }, [bidExpiryTime]);

  useEffect(() => {
    const audioUrl = paramData?.apiResponseData?.audio;
    if (!audioUrl) {
      return;
    }
    setaudioLoading(true);
    Sound.setCategory('Playback');
    soundRef.current = new Sound(audioUrl, null, error => {
      if (error) {
        setaudioLoading(false);
        return;
      }
      console.log('Sound loaded, duration:', soundRef.current.getDuration());
      setaudioLoading(false);
    });

    return () => {
      console.log('Cleaning up sound...');
      if (soundRef.current) {
        soundRef.current.release();
      }
    };
  }, [paramData]);

  const togglePlayback = () => {
    setIsPlaying(true);
    soundRef.current.play(success => {
      if (success) {
      } else {
      }
      setIsPlaying(false);
    });
  };

  const stopPlayback = () => {
    const sound = soundRef.current;
    if (!sound) return;

    sound.stop(() => {
      setIsPlaying(false);
    });
  };

  const _onOrderBidRideDetails = () => {
    const data = {
      order_id: paramData?.apiResponseData?.id || null,
      task_type: 'bid_ride_request',
    };

    const headerData = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };
    actions
      .orderRideBidDetails(data, headerData)
      .then(res => {
        console.log(res, 'restesttt');
        setAllDriverBidesList(res?.data?.biddata);
        if (!lastBidInfo) {
          var bidExpiryTime = new Date();
          bidExpiryTime.setSeconds(
            bidExpiryTime.getSeconds() +
              Number(res?.data?.bid_expire_time_limit_seconds),
          );
          actions.saveBidInAsync({
            bidData: paramData,
            expiryTime: bidExpiryTime,
          });
        }
        setBidExpiryTime(Number(res?.data?.bid_expire_time_limit_seconds));
      })
      .catch(error => {
        showError(error?.message);
      });
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
    actions
      .declineRideBid(apiData, headerData)
      .then(res => {
        _onOrderBidRideDetails();
      })
      .catch(error => {
        showError(error?.message);
      });
  };

  const _onAcceptRideBid = bidData => {
    const apiData = {
      bid_id: bidData?.id,
    };
    const headerData = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };

    actions
      .acceptRideForBid(apiData, headerData)
      .then(res => {
        navigation.navigate(navigationStrings.CHOOSECARTYPEANDTIMETAXI, {
          ...paramData,
          bidData: bidData,
          showPaymentModal: true,
        });
      })
      .catch(error => {
        showError(error?.message);
      });
  };

  const onPressLeft = (fromExpiry = false) => {
    Alert.alert(
      fromExpiry
        ? 'Looks like no drivers accepted your bid. Try placing another bid to get a ride.'
        : strings.DO_YOU_WANT_TO_CANCEL_BID_REQUEST,
      '',
      [
        {
          text: strings.NO,
          onPress: () => console.log('Cancel Pressed'),
          // style: 'destructive',
        },
        {
          text: strings.YES,
          onPress: () => {
            actions.clearLastBidData();
            // if (!lastBidInfo) {
            navigation.goBack();
            // } else {
            //   navigation.navigate(navigationStrings.TAXIHOMESCREEN);
            // }
          },
        },
      ],
    );
  };

  const renderDriverListCard = useCallback(
    ({item, index}) => {
      return (
        <BidAcceptRejectCard
          data={item}
          bidExpiryDuration={bidExpiryTime}
          _onDeclineBid={_onDeclineRideBid}
          _onAcceptRideBid={_onAcceptRideBid}
        />
      );
    },
    [allDriverBidesList, bidExpiryTime],
  );

  return (
    <WrapperContainer>
      <Header
        leftIcon={imagePath.backArrow}
        centerTitle={strings.ALL_BIDS}
        onPressLeft={() => {
          onPressLeft(false);
        }}
        leftIconStyle={{marginLeft: moderateScale(10)}}
        headerStyle={
          isDarkMode
            ? {backgroundColor: MyDarkTheme.colors.background}
            : {backgroundColor: colors.white}
        }
      />
      <View
        style={{
          marginHorizontal: moderateScale(20),
          marginVertical: moderateScaleVertical(20),
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {!isEmpty(paramData?.apiResponseData?.audio) ? (
          <TouchableOpacity
            onPress={isPlaying ? stopPlayback : togglePlayback}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f8f8',
              borderRadius: 80,
              padding: moderateScale(10),
              elevation: 4,
              width: moderateScale(40),
              height: moderateScale(40),
            }}>
            {audioLoading ? (
              <ActivityIndicator size={moderateScale(20)} />
            ) : (
              <Image
                style={{
                  left: isPlaying ? 0 : moderateScale(2),
                  width: moderateScale(20),
                  height: moderateScale(20),
                }}
                source={
                  isPlaying ? imagePath.stopbutton : imagePath.playbuttonR
                }
              />
            )}
          </TouchableOpacity>
        ) : null}
        {!isEmpty(paramData?.apiResponseData?.description) ? (
          <Text
            style={{
              fontSize: textScale(14),
              color: '#555',
              fontFamily: fontFamily.medium,
              marginLeft: moderateScale(20),
            }}>
            {paramData?.apiResponseData?.description}
          </Text>
        ) : null}
      </View>
      {isEmpty(allDriverBidesList) && (
        <View
          style={{
            justifyContent: 'center',
            flexDirection: 'row',
            backgroundColor: themeColors.primary_color,
            paddingVertical: moderateScaleVertical(10),
            borderTopLeftRadius: moderateScale(18),
            borderTopRightRadius: moderateScale(18),
          }}>
          <Text
            style={{
              color: colors.white,
              fontFamily: fontFamily?.bold,
              fontSize: textScale(13),
            }}>
            {strings.WAITING_FOR_DRIVER_BIDS}
          </Text>
          <UIActivityIndicator
            size={20}
            color={colors.white}
            style={{flex: 0.2}}
          />
        </View>
      )}

      <FlatList
        showsVerticalScrollIndicator={false}
        data={allDriverBidesList}
        renderItem={renderDriverListCard}
        contentContainerStyle={{
          backgroundColor: '#FEF2F5',
          flexGrow: 1,
        }}
        ListFooterComponent={() => (
          <View style={{marginLeft: moderateScale(16)}} />
        )}
        ListHeaderComponent={() => (
          <View style={{marginRight: moderateScale(16)}} />
        )}
      />
    </WrapperContainer>
  );
}
