import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import {SwipeListView} from 'react-native-swipe-list-view';
import {useSelector} from 'react-redux';
import Header from '../../Components/Header';
import WrapperContainer from '../../Components/WrapperContainer';
import imagePath from '../../constants/imagePath';
import strings from '../../constants/lang/index';
import colors from '../../styles/colors';
import {
  height,
  moderateScale,
  moderateScaleVertical,
} from '../../styles/responsiveSize';
import CardViewNotification from './CardViewNotification';
import actions from '../../redux/actions';
import {useIsFocused} from '@react-navigation/native';
import Animated, {FadeInUp} from 'react-native-reanimated';

export default function Notifications({navigation}) {
  const currentTheme = useSelector(state => state.appTheme);
  const {themeColors} = currentTheme;
  const {appStyle, appData, languages, currencies} = useSelector(
    state => state?.initBoot,
  );
  const fontFamily = appStyle?.fontSizeData;

  const [isLoading, setisLoading] = useState(false);
  const [notificationList, setnotificationList] = useState([]);
  const isinFocus = useIsFocused();

  useEffect(() => {
    getAllNotifications();
  }, [isinFocus]);

  const getAllNotifications = () => {
    setisLoading(true);
    let headers = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };
    actions
      .getNotificationsList(headers)
      .then(res => {
        setnotificationList(res?.data?.data || []);
        setisLoading(false);
      })
      .catch(() => setisLoading(false));
  };

  const renderOrders = ({item, index}) => (
    <Animated.View entering={FadeInUp.delay(index * 100)} style={{marginHorizontal: 16}}>
      <CardViewNotification data={item} />
    </Animated.View>
  );

  const EmptyComponent = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        marginTop:moderateScaleVertical(50)
      }}>
      <Image
        source={imagePath.emptyCartRoyo}
        style={{width: 160, height: 160, resizeMode: 'contain'}}
      />
      <Text
        style={{
          fontSize: 16,
          color: colors.textGreyB,
          marginTop: 16,
          fontFamily: fontFamily.medium,
          textAlign:'center',
          right:moderateScale(10)
        }}>
        No Notifications
      </Text>
    </View>
  );

  return (
    <WrapperContainer bgColor={colors.white} statusBarColor={colors.white}>
     <Header
        leftIcon={imagePath.back}
        centerTitle={strings.NOTIFICATION}
        headerStyle={{backgroundColor: colors.white}}
      />

      {!isLoading ? (
        <SwipeListView
          data={notificationList}
          
          renderItem={renderOrders}
          keyExtractor={(item, index) => String(index)}
          disableRightSwipe
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: moderateScaleVertical(20),
            paddingBottom: moderateScaleVertical(100),
          }}
          // ItemSeparatorComponent={() => <View style={{height: 16}} />}
        />
      ) : (
        <ActivityIndicator
          size={moderateScale(30)}
          style={{marginTop: height / 4}}
          color={themeColors.primary_color}
        />
      )}
    </WrapperContainer>
  );
}
