import {useEffect, useRef} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import InAppUpdates from 'sp-react-native-in-app-updates';
import strings from '../../constants/lang';

const UpdateManager = () => {
  const alertVisibleRef = useRef(false);
  let appConfig = {
    isForceUpdate: true,
    backgroundRefreshThreshold: 15,
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
        handleAppStateChange();
    }
  }, []);

  const handleAppStateChange = () => {
    if (!alertVisibleRef.current) {
      checkForUpdates();
    }
  };

  const checkForUpdates = async () => {
    const inAppUpdates = new InAppUpdates(false); // Debug mode is off

    try {
      const updateInfo = await inAppUpdates.checkNeedsUpdate();
      if (updateInfo?.shouldUpdate && !alertVisibleRef.current) {
        handleUpdateFlow();
      } else {
        console.log('No updates available');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleUpdateFlow = async () => {
    alertVisibleRef.current = true;
    Alert.alert(strings.UPDATE_AVAILABLE, strings.UPDATE_TEXT2, [
      {
        text: strings.UPDATE_NOW,
        onPress: async () => {
          if (appConfig.isForceUpdate) {
            alertVisibleRef.current = false;
          }

          openAppInPlayStore();
        },
      },
      appConfig.isForceUpdate == false && {
        text: strings.LATER,
        style: strings.CANCEL,
      },
    ]);
  };

  const openAppInPlayStore = async () => {
    const marketUrl = `market://details?id=com.cabjak.OrderApp`;
    const playStoreUrl = `https://play.google.com/store/apps/details?id=com.cabjak.OrderApp`; // Web fallback

    try {
      const supported = await Linking.canOpenURL(marketUrl);
      if (supported) {
        await Linking.openURL(marketUrl); // Open Play Store app
      } else {
        await Linking.openURL(playStoreUrl); // Fallback to web link
      }
    } catch (error) {}
  };

  // const startUpdateProcess = async (updateType) => {
  //   const inAppUpdates = new InAppUpdates(false); // Debug mode off
  //   try {
  //     await inAppUpdates.startUpdate(updateType);

  //     if (updateType === IAUUpdateKind.FLEXIBLE) {
  //       inAppUpdates.addStatusUpdateListener((status) => {
  //         if (status === IAUUpdateStatus.DOWNLOADED) {
  //           promptCompleteUpdate();
  //         }
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error starting update flow:', error);
  //   }
  // };

  // const promptCompleteUpdate = () => {
  //   Alert.alert(
  //     strings.UPDATE_READY,
  //     strings.UPDATE_TEXT3,
  //     [
  //       { text: strings.RESTART_NOW, onPress: () => completeUpdate() },
  //       { text: strings.LATER},
  //     ]
  //   );
  // };

  // const completeUpdate = async () => {
  //   const inAppUpdates = new InAppUpdates(false);

  //   try {
  //     await inAppUpdates.completeUpdate();
  //     console.log('Update applied successfully');
  //   } catch (error) {
  //     console.error('Error completing update:', error);
  //   }
  // };

  return null;
};

export default UpdateManager;
