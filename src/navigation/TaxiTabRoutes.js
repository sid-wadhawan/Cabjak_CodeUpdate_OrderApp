import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {getBundleId} from 'react-native-device-info';
import {useSelector} from 'react-redux';
import CustomBottomTabBar from '../Components/CustomBottomTabBar';
import CustomBottomTabBarFive from '../Components/CustomBottomTabBarFive';
import CustomBottomTabBarFour from '../Components/CustomBottomTabBarFour';
import CustomBottomTabBarThree from '../Components/CustomBottomTabBarThree';
import CustomBottomTabBarTwo from '../Components/CustomBottomTabBarTwo';
import imagePath from '../constants/imagePath';
import strings from '../constants/lang';
import colors from '../styles/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../styles/responsiveSize';
import {appIds} from '../utils/constants/DynamicAppKeys';
import {tabBarVisibilityConfig} from '../utils/helperFunctions';
import AccountStack from './AccountStack';
import HomeStack from './HomeStack';
import LeaderBoardStack from './LeaderBoardStack';
import MyOrdersStack from './MyOrdersStack';
import navigationStrings from './navigationStrings';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export default function TaxiTabRoutes(props) {
  const {appStyle, themeColors, currentRouteName} = useSelector(
    state => state?.initBoot,
  );

  const getTabBarVisibility = (route, navigation, screens = []) => {
      if (navigation && navigation?.isFocused && navigation.isFocused()) {
        const route_name = getFocusedRouteNameFromRoute(route);
        if (screens.includes(route_name)) {
          showBottomBar_ = false;
          return false;
        }
        showBottomBar_ = true;
        return true;
      }
    };

  const fontFamily = appStyle?.fontSizeData;

  return (
    <Tab.Navigator
      backBehavior={'initialRoute'}
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          textTransform: 'capitalize',
          fontFamily: fontFamily?.medium,
          fontSize: textScale(12),
          color: colors.white,
        },
      }}
      tabBar={props => {
        console.log('TabBarProps::', currentRouteName);
        if (tabBarVisibilityConfig(currentRouteName)) {
          return null;
        }
        switch (appStyle?.tabBarLayout) {
          case 1:
            return <CustomBottomTabBar {...props} />;
          case 2:
            return <CustomBottomTabBarTwo {...props} />;
          case 3:
            return <CustomBottomTabBarThree {...props} />;
          case 4:
            return <CustomBottomTabBarFour {...props} />;
          case 5:
            return <CustomBottomTabBarFive {...props} />;
        }
      }}>
      <Tab.Screen
        component={HomeStack}
        name={navigationStrings.HOMESTACK}
        options={{
          tabBarLabel: strings.HOME,
          tabBarIcon: ({focused, tintColor}) => (
            <Image
              style={{
                tintColor: focused ? themeColors?.primary_color : colors.black,
                height: moderateScaleVertical(28),
                width: moderateScaleVertical(28),
                resizeMode: 'contain',
              }}
              source={
                appStyle?.tabBarLayout === 5
                  ? focused
                    ? imagePath.homeActive
                    : imagePath.homeInActive
                  : appStyle?.tabBarLayout === 4
                  ? focused
                    ? imagePath.homeRedActive
                    : imagePath.homeRedInActive
                  : focused
                  ? imagePath.tabAActive
                  : imagePath.tabAInActive
              }
            />
          ),
          // unmountOnBlur: true,
        }}
      />
      <Tab.Screen
        component={LeaderBoardStack}
        name={navigationStrings.LEADER_BOARD_STACK}
        options={{
          tabBarLabel: strings.REWARDS,
          tabBarIcon: ({focused, tintColor}) => (
            <Image
              style={{
                tintColor: focused ? themeColors?.primary_color : colors.black,
                height: moderateScaleVertical(30),
                width: moderateScaleVertical(30),
                resizeMode: 'contain',
              }}
              source={focused ? imagePath.IcRewardAc : imagePath.IcRewardNoAc}
            />
          ),
          // unmountOnBlur: true,
        }}
      />
      <Tab.Screen
        component={MyOrdersStack}
        name={navigationStrings.MY_ORDERS}
        options={{
          tabBarLabel: strings.MYRIDES,
          tabBarLabelStyle: {textTransform: 'uppercase'},
          tabBarIcon: ({focused, tintColor}) => {
            return (
              <Image
                style={{
                  tintColor: focused
                    ? themeColors?.primary_color
                    : colors.black,
                  height: moderateScaleVertical(28),
                  width: moderateScaleVertical(28),
                  resizeMode: 'contain',
                }}
                source={
                  appStyle?.tabBarLayout === 6
                    ? focused
                      ? imagePath.settings_red_icon
                      : imagePath.settings_icon
                    : appStyle?.tabBarLayout === 5
                    ? focused
                      ? appIds.mml == getBundleId()
                        ? imagePath?.activeTruck
                        : imagePath.icMyRideActive
                      : appIds.mml == getBundleId()
                      ? imagePath?.inactiveTruck
                      : imagePath.icMyRideInActive
                    : focused
                    ? appIds.mml == getBundleId()
                      ? imagePath?.activeTruck
                      : imagePath.rideFilled
                    : appIds.mml == getBundleId()
                    ? imagePath?.inactiveTruck
                    : imagePath.ride
                }
              />
            );
          },
          // unmountOnBlur: true,
        }}
      />

      <Tab.Screen
        component={AccountStack}
        name={navigationStrings.ACCOUNTS}
        options={({route, navigation}) => ({
           tabBarVisible: getTabBarVisibility(route, navigation, [
                      navigationStrings.MY_PROFILE,
                      navigationStrings.LOYALTY,
                      navigationStrings.NOTIFICATION,
                      navigationStrings.WALLET,
                      navigationStrings.SETTIGS,
                    ]),
          tabBarLabel: strings.ACCOUNT1,
          tabBarLabelStyle: {textTransform: 'uppercase'},
          tabBarIcon: ({focused, tintColor}) => (
            <Image
              style={{
                tintColor: focused ? themeColors?.primary_color : colors.black,
                height: moderateScaleVertical(26),
                width: moderateScaleVertical(26),
                resizeMode: 'contain',
              }}
              source={
                appStyle?.tabBarLayout === 5
                  ? focused
                    ? imagePath.profileActive
                    : imagePath.profileInActive
                  : appStyle?.tabBarLayout === 4
                  ? focused
                    ? imagePath.accountRedActive
                    : imagePath.accountRedInActive
                  : focused
                  ? imagePath.tabEActive
                  : imagePath.tabEInActive
              }
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
}

export function stylesData(params) {
  const {appStyle} = useSelector(state => state.initBoot);
  const fontFamily = appStyle?.fontSizeData;

  const styles = StyleSheet.create({
    cartItemCountView: {
      position: 'absolute',
      zIndex: 100,
      top: -5,
      right: -5,
      backgroundColor: colors.cartItemPrice,
      width: moderateScale(18),
      height: moderateScale(18),
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartItemCountNumber: {
      fontFamily: fontFamily?.bold,
      color: colors.white,
      fontSize: textScale(8),
    },
  });
  return styles;
}
