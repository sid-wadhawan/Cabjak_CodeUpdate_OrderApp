import React, {useEffect, useRef} from 'react';
import {Image, View} from 'react-native';
import {AnimatedRegion, Marker} from 'react-native-maps';
import {moderateScale} from '../styles/responsiveSize';

const MapCarMark = ({coordinates, index, imagepath, driverid}) => {
  const vehicleRef = useRef(
    new AnimatedRegion({
      latitude: parseFloat(coordinates?.lat || 0),
      longitude: parseFloat(coordinates?.long || 0),
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    }),
  ).current;

  useEffect(() => {
    const newCoordinate = {
      latitude: parseFloat(coordinates?.lat || 0),
      longitude: parseFloat(coordinates?.long || 0),
    };
    vehicleRef
      .timing({
        ...newCoordinate,
        duration: 6000,
        useNativeDriver: false,
      })
      .start();
  }, [coordinates]);

  return (
    <Marker.Animated
      // id={driverid}
      key={driverid}
      identifier={String(driverid)}
      style={{zIndex: index + 2}}
      flat
      coordinate={vehicleRef}
      anchor={{x: 0.5, y: 0.5}}>
      <View
        style={{
          width: moderateScale(50),
          height: moderateScale(50),
          alignItems: 'center',
          zIndex: 99,
          justifyContent: 'center',
        }}>
        <Image
          style={{
            resizeMode: 'contain',
            transform: [
              {
                rotate: `${Number(coordinates?.headingAngle ?? 0)}deg`,
              },
            ],
          }}
          source={imagepath}
        />
      </View>
    </Marker.Animated>
  );
};
export default React.memo(MapCarMark);
