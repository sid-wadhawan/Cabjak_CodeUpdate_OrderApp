import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { enableFreeze } from 'react-native-screens';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import Header from '../../Components/Header';
import WrapperContainer from '../../Components/WrapperContainer';
import imagePath from '../../constants/imagePath';
import colors from '../../styles/colors';
import commonStylesFun from '../../styles/commonStyles';
import { moderateScale } from '../../styles/responsiveSize';
import stylesFun from './styles';
enableFreeze(true);

export default function WebviewScreen({navigation, route}) {
  const paramData = route?.params;
  const [state, setState] = useState({});
  //update your state
  const updateState = data => setState(state => ({...state, ...data}));

  //Redux Store Data
  const {appData, themeColors, appStyle, currencies, languages} = useSelector(
    state => state?.initBoot,
  );
  const userData = useSelector(state => state.auth.userData);
  const fontFamily = appStyle?.fontSizeData;
  const styles = stylesFun({fontFamily});
  const commonStyles = commonStylesFun({fontFamily});

  //Navigation to specific screen
  const moveToNewScreen = (screenName, data) => () => {
    navigation.navigate(screenName, {data});
  };

  console.log(paramData?.url,'ddsuparamData?.url')

  return (
    <WrapperContainer
      bgColor={colors.backgroundGrey}
      statusBarColor={colors.white}>
      <Header
        leftIcon={
          appStyle?.homePageLayout === 3 || appStyle?.homePageLayout === 5
            ? imagePath.icBackb
            : imagePath.back
        }
        centerTitle={paramData?.title || ''}
        headerStyle={{backgroundColor: colors.white}}
      />
      <View style={{...commonStyles.headerTopLine}} />
      <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: paramData?.url }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        thirdPartyCookiesEnabled={true}
        originWhitelist={['https://*']} 
        // startInLoadingState={true}
        // scalesPageToFit={true} 
        // renderLoading={() => (
        //   <ActivityIndicator
        //     size="large"
        //     color="#999999"
        //     style={{ flex: 1 }}
        //   />
        // )}
        onError={(e) => console.warn('WebView error:', e.nativeEvent)}
      />
    </View>
    </WrapperContainer>
  );
}
