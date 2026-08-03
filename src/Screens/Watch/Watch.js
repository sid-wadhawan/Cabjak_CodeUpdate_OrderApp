import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import Video from 'react-native-video';
import {useSelector} from 'react-redux';
import WrapperContainer from '../../Components/WrapperContainer';
import imagePath from '../../constants/imagePath';
import actions from '../../redux/actions';
import colors from '../../styles/colors';
import {height, moderateScale, width} from '../../styles/responsiveSize';
import {MyDarkTheme} from '../../styles/theme';
import {useFocusEffect} from '@react-navigation/native';

export default function Watch({navigation, route}) {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retry, setRetry] = useState(false);
  const [paused, setPaused] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [muted, setmuted] = useState(true);
  const [isLandscape, setIsLandscape] = useState('');
  const paramsData = route?.params?.data;
  const {appData, currencies, languages} = useSelector(
    state => state?.initBoot,
  );

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      headerLeft: () => null,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  useEffect(() => {
    let lastOrientation = null;

    Orientation.getDeviceOrientation(firstPosition => {
      if (!firstPosition.includes('PORTRAIT-UPSIDEDOWN')) {
        setIsLandscape(firstPosition);
        Orientation.lockToPortrait();
      }
    });

    const handleOrientationChange = newOrientation => {
      if (!newOrientation || newOrientation === lastOrientation) return;
      lastOrientation = newOrientation;
      if (!newOrientation.includes('PORTRAIT-UPSIDEDOWN')) {
        setTimeout(() => {
          setIsLandscape(newOrientation);
          Orientation.lockToPortrait();
        }, 200);
      } else Orientation.lockToPortrait();
    };

    Orientation.addDeviceOrientationListener(handleOrientationChange);

    return () => {
      try {
        Orientation.removeDeviceOrientationListener(handleOrientationChange);
        Orientation.lockToPortrait();
      } catch (err) {
        console.warn('Orientation cleanup skipped:', err.message);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPaused(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        setPaused(false);
      } else {
        setPaused(true);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unmuteTimer = setTimeout(() => {
      setmuted(false); // unmute after 1s or on user interaction
    }, 1500);

    return () => clearTimeout(unmuteTimer);
  }, []);

  const handleLoad = useCallback(data => {
    setIsVideoLoaded(true);
    setHasError(false);
    setRetry(false);
    setVideoDuration(data.duration);
  }, []);

  const handleBuffer = useCallback(({isBuffering}) => {
    setIsBuffering(isBuffering);
  }, []);

  const handleError = useCallback(error => {
    setHasError(true);
    setRetry(true);
    Alert.alert('Error', 'Failed to load advertisement.', [
      {text: 'Retry', onPress: () => navigation.goBack()},
    ]);
  }, []);

  const handleEnd = () => {
    setPaused(true);
    const headers = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };

    // Seek to last frame when the video ends
    // if (videoRef.current) {
    //   videoRef.current.seek(videoDuration - 0.033);
    // }

    actions
      .watchAdvertisement(`/${paramsData?.advertisement?.id}`, {}, headers)
      .then(res => setHasEnded(true))
      .catch(err => setHasEnded(true));
  };

  return (
    <WrapperContainer
      bgColor={MyDarkTheme.colors.background}
      statusBarColor={MyDarkTheme.colors.background}
      barStyle={'light-content'}>
      <View style={styles.container}>
        {hasEnded ? (
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              position: 'absolute',
              top: moderateScale(20),
              left: moderateScale(20),
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: moderateScale(20),
              padding: moderateScale(2),
              zIndex: 5,
            }}>
            <Image
              source={imagePath.crossCancel}
              style={{
                width: moderateScale(26),
                height: moderateScale(26),
                resizeMode: 'contain',
                tintColor: colors.whiteOpacity77,
              }}
            />
          </Pressable>
        ) : (
          <></>
        )}

        {!isVideoLoaded && !hasError ? (
          <ActivityIndicator
            size="large"
            color={colors.white}
            style={{position: 'absolute'}}
          />
        ) : (
          <></>
        )}

        {hasError ? (
          <Pressable
            style={styles.retryContainer}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Back</Text>
          </Pressable>
        ) : (
          <Video
            ref={videoRef}
            source={{uri: paramsData?.advertisement?.advertisement_url}}
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000,
            }}
            onBuffer={handleBuffer}
            onError={handleError}
            onEnd={handleEnd}
            paused={paused}
            muted={muted}
            pictureInPicture={false}
            resizeMode={'contain'}
            style={{
              width: isLandscape?.includes('LANDSCAPE') ? height : width,
              height: isLandscape?.includes('LANDSCAPE') ? width : height,
              transform:
                isLandscape === 'LANDSCAPE-RIGHT'
                  ? [{rotate: '270deg'}]
                  : isLandscape === 'LANDSCAPE-LEFT'
                  ? [{rotate: '90deg'}]
                  : [{rotate: '0deg'}],
            }}
            preventsDisplaySleepDuringVideoPlayback={true}
          />
        )}
      </View>
    </WrapperContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poster: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    zIndex: 99,
  },
  retryContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
});
