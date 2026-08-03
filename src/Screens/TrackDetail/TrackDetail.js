import React, {useEffect, useRef, useState} from 'react';
import {Image, Platform, StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';
import Header from '../../Components/Header';
import StepIndicators from '../../Components/StepIndicator';
import WrapperContainer from '../../Components/WrapperContainer';
import imagePath from '../../constants/imagePath';
import strings from '../../constants/lang/index';
import navigationStrings from '../../navigation/navigationStrings';
import colors from '../../styles/colors';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../styles/responsiveSize';
import stylesFun from './styles';
import commonStylesFun from '../../styles/commonStyles';
import actions from '../../redux/actions';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import commonStyles from '../../styles/commonStyles';
import MapView, {
  AnimatedRegion,
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import {isEmpty} from 'lodash';
import {locationPermission} from '../../utils/permissions';
import {getCurrentLocationFromApi} from '../../utils/googlePlaceApi';
import StepIndicator from 'react-native-step-indicator';
import useInterval from '../../utils/useInterval';
import {showError} from '../../utils/helperFunctions';

import {enableFreeze} from 'react-native-screens';
import {useDarkMode} from 'react-native-dynamic';
import {MyDarkTheme} from '../../styles/theme';
import {blueMapStyle} from '../../utils/constants/MapStyle';
import CustomCallouts from '../../Components/CustomCallouts';
enableFreeze(true);

export default function TrackiDetail({navigation, route}) {
  const [state, setState] = useState({
    labels: [
      'Order\nSubmitted',
      'Start\nShipping',
      'On the\nWay',
      'Will be\nDelivered',
    ],
    orderPickupDropLocation: [],
    coordinate: {
      latitude: 30.7173,
      longitude: 76.8035,
      latitudeDelta: 0.0222,
      longitudeDelta: 0.032,
    },
    animateDriver: {
      latitude: 30.7173,
      longitude: 76.8035,
      latitudeDelta: 0.0222,
      longitudeDelta: 0.032,
    },
    driverMarkerlocation: {
      latitude: 30.7173,
      longitude: 76.8035,
      latitudeDelta: 0.0222,
      longitudeDelta: 0.032,
    },
    currentPosition: null,
    orderAllStatus: [],
    isLoading: true,
  });

  const {
    orderPickupDropLocation,
    coordinate,
    driverMarkerlocation,
    currentPosition,
    orderAllStatus,
    isLoading,
  } = state;

  const updateState = data => setState(state => ({...state, ...data}));
  const {
    appData,
    currencies,
    languages,
    themeColors,
    appStyle,
    themeColor,
    themeToggle,
    animateDriver,
  } = useSelector(state => state?.initBoot);

  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const userData = useSelector(state => state.auth.userData);
  const [zoomRoute, setzoomRoute] = useState(true)
  const {labels} = state;

  const fontFamily = appStyle?.fontSizeData;
  const styles = stylesFun({fontFamily, themeColors});
  const isFocused = useIsFocused();

  const moveToNewScreen =
    (screenName, data = {}) =>
    () => {
      navigation.navigate(screenName, {data});
    };

  useFocusEffect(
    React.useCallback(() => {
      getLiveLocation();
    }, []),
  );

  const getLiveLocation = async () => {
    const locPermissionDenied = await locationPermission();
    if (locPermissionDenied) {
      const {latitude, longitude} = await getCurrentLocationFromApi();
      // console.log("get live location after 4 second")
      updateState({
        coordinate: {
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.0222,
          longitudeDelta: 0.032,
        },
      });
      orderTrackingThroughDeepLinking();
    }
  };

  useInterval(
    () => {
      if (route?.params?.data && coordinate) {
        orderTrackingThroughDeepLinking();
      }
    },
    isFocused ? 5000 : null,
  );

  const orderTrackingThroughDeepLinking = () => {
    const apiData = {
      order_number: route?.params?.data,
    };
    actions
      .orderTracingForDeepLinking(apiData, {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      })
      .then(res => {
        updateState({
          orderPickupDropLocation: res?.data?.dispatch_order?.tasks,
          isLoading: false,
          animateDriver: {
            latitude: parseFloat(res?.data?.agent_location?.lat),
            longitude: parseFloat(res?.data?.agent_location?.long),
            latitudeDelta: 0.0222,
            longitudeDelta: 0.032,
          },
          driverMarkerlocation: {
            latitude: parseFloat(res?.data?.agent_location?.lat),
            longitude: parseFloat(res?.data?.agent_location?.long),
            latitudeDelta: 0.0222,
            longitudeDelta: 0.032,
            headingAngle: res?.data?.agent_location?.heading_angle,
          },
          currentPosition: res?.data?.ordervendor?.order_status_option_id,
          orderAllStatus: res?.data?.order_status_vendor,
        });
        setzoomRoute(false)
      })
      .catch(error => {
        updateState({isLoading: false});
        showError(error?.message || error?.msg);
        navigation.goBack();
      });
  };

  const fitToMap = () => {
    if (orderPickupDropLocation && orderPickupDropLocation.length) {
      let newArray = orderPickupDropLocation.map((i, inx) => {
        console.log(i, 'i+++++++++');
        return {
          latitude: Number(i?.latitude),
          longitude: Number(i?.longitude),
        };
      });
      // animate(region);
      setTimeout(() => {
        // animate(region);
        fitPadding(newArray);
      }, 500);
    }
  };

  useEffect(() => {
    if(zoomRoute){
 fitToMap();
 
    }
   
  }, [orderPickupDropLocation]);

  const fitPadding = newArray => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([!!driverMarkerlocation?.latitude ? driverMarkerlocation :  coordinate, ...newArray], {
        edgePadding: {top: 80, right: 80, bottom: 80, left: 80},
        animated: true,
      });
    }
  };

  // const renderStepIndicator = ({position, stepStatus}) => {
  //   //console.log(position, 'position', stepStatus, 'stepStatus');
  //   return (
  //     <Image
  //       style={{
  //         width: moderateScale(30),
  //         height: moderateScale(30),
  //       }}
  //       source={{uri: dispatcherStatus?.dispatcher_status_icons[position]}}
  //     />
  //   );
  // };

  return (
    <WrapperContainer
      bgColor={
        isDarkMode ? MyDarkTheme.colors.background : colors.backgroundGrey
      }
      statusBarColor={colors.backgroundGrey}
      isLoading={isLoading}>
      <Header
        centerTitle={strings.TRACKDETAIL}
        headerStyle={{
          backgroundColor: isDarkMode
            ? MyDarkTheme.colors.background
            : colors.backgroundGrey,
        }}
      />

      <View style={{...commonStyles.headerTopLine}} />
      <View style={styles.topSection}>
        {/* {basicInfoView()} */}

        {!isEmpty(orderAllStatus) ? (
          <StepIndicator
            stepCount={orderAllStatus?.length} //showing step indicators dynamically
            currentPosition={currentPosition}
          />
        ) : null}
        {!isEmpty(orderAllStatus) ? (
          <Text
            style={{
              marginTop: moderateScaleVertical(15),
              marginVertical: moderateScaleVertical(10),
              marginHorizontal: moderateScale(31),
              color: themeColors?.primary_color,
              fontFamily: fontFamily?.bold,
              textAlign: 'center',
            }}>
            {orderAllStatus[orderAllStatus?.length - 1].status?.title}
          </Text>
        ) : null}
      </View>
      {!isEmpty(orderPickupDropLocation[0]?.latitude) &&
      !isEmpty(orderPickupDropLocation[1]?.latitude) ? (
        <View style={styles.bottomSection}>
          <View style={{width: '100%', height: '100%'}}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              // region={coordinate}
              rotateEnabled={false}
              maxZoomLevel={18}
              customMapStyle={blueMapStyle}
              showsIndoors={true}
              provider={
                Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
              }>
              <MapViewDirections
                resetOnChange={false}
                origin={{
                  latitude: !!driverMarkerlocation?.latitude ? parseFloat(driverMarkerlocation?.latitude) : parseFloat(orderPickupDropLocation[0]?.latitude),
                  longitude: !!driverMarkerlocation?.longitude ? parseFloat(driverMarkerlocation?.longitude) : parseFloat(orderPickupDropLocation[0]?.longitude),
                  latitudeDelta: 0.0222,
                  longitudeDelta: 0.032,
                }}
                destination={{
                  latitude: parseFloat(orderPickupDropLocation[1]?.latitude),
                  longitude: parseFloat(orderPickupDropLocation[1]?.longitude),
                  latitudeDelta: 0.0222,
                  longitudeDelta: 0.032,
                }}
                apikey={appData.profile?.preferences?.map_key}
                strokeWidth={4}
                strokeColor={colors.black}
                optimizeWaypoints={true}
                onStart={params => {}}
                precision={'high'}
                timePrecision={'now'}
                mode={'DRIVING'}
              />
              <CustomCallouts
                data={[
                  {
                    latitude: parseFloat(orderPickupDropLocation[0]?.latitude),
                    longitude: parseFloat(
                      orderPickupDropLocation[0]?.longitude,
                    ),
                  },
                  {
                    latitude: parseFloat(orderPickupDropLocation[1]?.latitude),
                    longitude: parseFloat(
                      orderPickupDropLocation[1]?.longitude,
                    ),
                  },
                ]}
              />
              {/* <Marker
                coordinate={{
                  latitude: parseFloat(orderPickupDropLocation[0]?.latitude),
                  longitude: parseFloat(orderPickupDropLocation[0]?.longitude),
                  latitudeDelta: 0.0222,
                  longitudeDelta: 0.032,
                }}
                image={imagePath.icDestination}
              /> */}
              {/* <Marker
                coordinate={{
                  latitude: parseFloat(orderPickupDropLocation[1]?.latitude),
                  longitude: parseFloat(orderPickupDropLocation[1]?.longitude),
                  latitudeDelta: 0.0222,
                  longitudeDelta: 0.032,
                }}
                image={imagePath.icDestination}
              /> */}
              {driverMarkerlocation?.latitude ? (
                <Marker.Animated
                  flat
                  anchor={{x: 0.5, y: 0.5}}
                  ref={markerRef}
                  style={{zIndex:2}}
                  coordinate={driverMarkerlocation}>
                  <View
                    style={{
                      width: moderateScale(50), // Larger than image
                      height: moderateScale(50),
                      alignItems: 'center',
                      zIndex: 99,
                      justifyContent: 'center',
                    }}>
                    <Image
                      source={imagePath.taxiTopView}
                      style={{
                        resizeMode: 'contain',
                        transform: [
                          {
                            rotate: `${Number(
                              driverMarkerlocation?.headingAngle ?? 0,
                            )}deg`,
                          },
                        ],
                      }}
                    />
                  </View>
                </Marker.Animated>
              ) : null}
            </MapView>
          </View>
        </View>
      ) : null}
    </WrapperContainer>
  );
}
