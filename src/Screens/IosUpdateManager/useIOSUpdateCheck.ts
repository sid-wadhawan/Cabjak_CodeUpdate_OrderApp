import {useEffect, useRef} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import SpInAppUpdates from 'sp-react-native-in-app-updates';
import strings from '../../constants/lang';

const appStoreURL = 'https://apps.apple.com/app/id6749265440'; // Replace with actual App Store URL

const useIOSUpdateCheck = () => {
  const alertVisibleRef = useRef<boolean>(false);
  let appConfig = {
    isForceUpdate: true,
    backgroundRefreshThreshold: 15,
  };

  useEffect(() => {
    if (Platform.OS === 'ios') {
      setTimeout(() => {
        handleAppStateChange();
      }, 10000);
        
    }
  }, []);

  const handleAppStateChange = () => {
    if (!alertVisibleRef.current) {
      checkForUpdates();
    }
  };

  const checkForUpdates = async () => {
    const inAppUpdates = new SpInAppUpdates(false);
    inAppUpdates.checkNeedsUpdate().then(result => {
      console.log(result, '<===result');
      if (result?.shouldUpdate) {
        promptUpdate();
      }
    });
  };

  const promptUpdate = () => {
    alertVisibleRef.current = true;

    Alert.alert(
      strings.UPDATE_AVAILABLE,
      strings.UPDATE_TEXT1,
      [
        {
          text: strings.UPDATE_NOW,
          onPress: async () => {
            if (appConfig.isForceUpdate) {
              alertVisibleRef.current = false;
            }
            Linking.openURL(appStoreURL);
          },
          style: 'default',
        },
        !appConfig.isForceUpdate && {
          text: strings.LATER,
          style: 'destructive',
          onPress: () => {},
        },
      ].filter(Boolean) as {
        text: string;
        style: 'default' | 'destructive';
        onPress?: () => void;
      }[],
      {cancelable: false},
    );
  };
};

export default useIOSUpdateCheck;
