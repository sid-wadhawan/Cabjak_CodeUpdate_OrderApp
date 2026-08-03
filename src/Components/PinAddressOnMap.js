import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import {View} from 'react-native-animatable';
import {useDarkMode} from 'react-native-dynamic';
import MapView, {PROVIDER_DEFAULT, PROVIDER_GOOGLE} from 'react-native-maps';
import {useSelector} from 'react-redux';
import imagePath from '../constants/imagePath';
import strings from '../constants/lang';
import colors from '../styles/colors';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  StatusBarHeightSecond,
  width,
} from '../styles/responsiveSize';
import {MyDarkTheme} from '../styles/theme';
import {getCurrentLocation} from '../utils/helperFunctions';
import {chekLocationPermission} from '../utils/permissions';
import BottomSheetModal from './BottomSheetModal';
import GradientButton from './GradientButton';
import Geocoder from 'react-native-geocoding';
import {blueMapStyle} from '../utils/constants/MapStyle';
import actions from '../redux/actions';
import MapCarMark from './MapCarMark';
import useInterval from '../utils/useInterval';
import { useIsFocused } from '@react-navigation/native';

export default function PinAddressOnMap({
  onBackPress = () => {},
  onDone = () => {},
  pickUpLocationLatLng = {},
  onMapLoaded = () => {},
}) {
  const mapRef = React.createRef();
  const paramData = {};

  const {
    appData,
    themeColors,
    appStyle,
    themeToggle,
    themeColor,
    currencies,
    languages,
  } = useSelector(state => state?.initBoot);
  const darkthemeusingDevice = useDarkMode();
  const [onRoadDrivers, setonRoadDrivers] = useState([]);
  const isFocused = useIsFocused();

  const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;
  const [state, setState] = useState({
    region: {
      latitude: parseFloat(pickUpLocationLatLng?.latitude) || 30.7333,
      longitude: parseFloat(pickUpLocationLatLng?.longitude) || 76.7794,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    },
    coordinate: {
      latitude: parseFloat(pickUpLocationLatLng?.latitude) || 30.7333,
      longitude: parseFloat(pickUpLocationLatLng?.longitude) || 76.7794,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    },
    isLoading: false,
    details: {},
    addressLabel: 'Glenpark',
    formattedAddress: '8502 Preston Rd. Inglewood, Maine 98380',

    userCurrentLongitude: null,
    userCurrentLatitude: null,
    isVisible: false,
    task_type_id: null,
  });

  const {
    isLoading,
    addressLabel,

    formattedAddress,
    region,
    coordinate,
    userCurrentLongitude,
    userCurrentLatitude,
    isVisible,
    task_type_id,
    details,
  } = state;

  const updateState = data => setState(state => ({...state, ...data}));

  const fontFamily = appStyle?.fontSizeData;

   useInterval(
    () => {
      getAllNearbyDrivers(false);
    },
    isFocused ? 5000 : null,
  );

  const _onRegionChange = regn => {
    updateState({region: regn});
    _getAddressBasedOnCoordinates(regn);
    getAllNearbyDrivers(true, regn?.latitude, regn?.longitude);
  };

  const getAllNearbyDrivers = (movem = false,lat, long) => {
    actions
      .getAllNearByDrivers(
        {
          latitude: lat ? lat:region.latitude,
          longitude: long ? long :region.longitude,
        },
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      )
      .then(res => {
        if (res?.data?.length > 0) {
          if(movem){
           setonRoadDrivers([])
          }
          fetchSnapped(res?.data);
        }
      
      })
      .catch(error => {
        console.log(error, 'sduaydgafdtsfsa');
      });
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
  const _getAddressBasedOnCoordinates = region => {
    Geocoder.from({
      latitude: region.latitude,
      longitude: region.longitude,
    })
      .then(json => {
        // console.log(json, 'json');
        updateState({
          formattedAddress: json.results[0].formatted_address,
        });
        let detail = {};
        detail = {
          formatted_address: json.results[0].formatted_address,
          geometry: {
            location: {
              lat: region.latitude,
              lng: region.longitude,
            },
          },
          address_components: json.results[0].address_components,
          place_id: json.results[0].place_id,
        };
        updateState({
          details: detail,
        });
      })
      .catch(error => console.log(error, 'errro geocode'));
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
          return imagePath.taxiTopView;
          break;
      }
    };

  useEffect(() => {
    chekLocationPermission()
      .then(result => {
        if (result !== 'goback') {
          getCurrentLocation('home')
            .then(res => {
              Geolocation.getCurrentPosition(
                //Will give you the current location
                position => {
                  //getting the Longitude from the location json
                  const currentLongitude = JSON.stringify(
                    position.coords.longitude,
                  );

                  //getting the Latitude from the location json
                  const currentLatitude = JSON.stringify(
                    position.coords.latitude,
                  );
                  updateState({
                    userCurrentLongitude: currentLongitude,
                    userCurrentLatitude: currentLatitude,
                  });
                },
                error => alert(error.message),
                {
                  enableHighAccuracy: true,
                  timeout: 20000,
                  maximumAge: 1000,
                },
              );
            })
            .catch(err => {});
        }
      })
      .catch(error => console.log('error while accessing location', error));
  }, []);

  const _modeToNextScreen = () => {
    // const {params} = route;
    const pickuplocationAllData = {
      longitude: details?.geometry?.location?.lng,
      latitude: details?.geometry?.location?.lat,
      address: details?.formatted_address,
      task_type_id: pickUpLocationLatLng?.task_id,
      pre_address: details?.formatted_address,
      place_id: details?.place_id,
    };
    onDone(pickuplocationAllData);

    //   }
  };

  const markerRef = useRef();

  return (
    <BottomSheetModal snapPoints={[height]}>
      <MapView
        ref={mapRef}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        style={{
          ...StyleSheet.absoluteFillObject,
        }}
        customMapStyle={blueMapStyle}
        onMapLoaded={onMapLoaded}
        // region={region}
        initialRegion={region}
        // pointerEvents={'none'}
        onRegionChangeComplete={_onRegionChange}>
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
      </MapView>

      <View
        style={[
          {
            position: 'absolute',
            left: 0,
            marginHorizontal: moderateScale(30),
            marginVertical: moderateScaleVertical(50),
          },
          {marginHorizontal: moderateScale(15)},
        ]}>
        <TouchableOpacity onPress={onBackPress}>
          <View
            style={{
              paddingHorizontal: moderateScale(15),
              paddingVertical: moderateScaleVertical(15),
            }}>
            <Image
              style={{
                tintColor: isDarkMode ? MyDarkTheme.colors.text : colors.black,
              }}
              source={imagePath.backArrow}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View
        style={{
          position: 'absolute',
          top: height / 2 - StatusBarHeightSecond,
          right: width / 2,
          left: width / 2,
          bottom: height / 2,
          alignItems: 'center',
          justifyContent: 'center',
          // marginTop: height / 2,
        }}>
        <Image
          source={imagePath.icLocationPin_}
          style={{tintColor: themeColors.primary_color}}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 100,
          width: width - 40,
          alignSelf: 'center',
        }}>
        <Text
          style={{
            marginBottom: 40,
            textAlign: 'center',
            color: colors.black,
            fontFamily: fontFamily.medium,
          }}>
          {strings.PLACE_PIN_ON_MAP}
        </Text>
        <GradientButton
          btnText={strings.DONE}
          onPress={() => _modeToNextScreen()}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
