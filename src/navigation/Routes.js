import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import * as React from 'react';

import {useSelector} from 'react-redux';
import actions from '../redux/actions';
import {
  Addaddress2,
  ChatRoom,
  ChatRoomForVendor,
  ChatScreen,
  ChatScreenForVendor,
  P2pChatRoom,
  P2pChatScreen,
} from '../Screens';
import AppIntro from '../Screens/AppIntro';
import MyFatoorah from '../Screens/PaymentGateways/MyFatoorah';
import ShortCode from '../Screens/ShortCode/ShortCode';
import AuthStack from './AuthStack';
import CourierStack from './CourierStack';
import DrawerRoutes from './DrawerRoutes';
import {navigationRef} from './NavigationService';
import navigationStrings from './navigationStrings';
import TabRoutes from './TabRoutes';
import TabRoutesP2p from './TabRoutesP2p';
import TabRoutesP2pOnDemand from './TabRoutesP2pOnDemand';
import TabRoutesVendor from './TabRoutesVendor';
import TaxiTabRoutes from './TaxiTabRoutes';
import TabRoutesVendorNewTemplate from './VendorApp/TabRoutesVendor';

const Stack = createNativeStackNavigator();
const routeNameRef = React.createRef();

export default function Routes() {
  const linking = {
    prefixes: ['', 'https://order.cabjak.com'],
    config: {},
  };
  const {userData, appSessionInfo} = useSelector(state => state?.auth || {});
  const {appStyle, themeColors, appData} = useSelector(
    state => state?.initBoot || {},
  );
  const businessType = appStyle?.homePageLayout;

  return (
    <NavigationContainer
      onReady={() =>
        (routeNameRef.current = navigationRef.current.getCurrentRoute().name)
      }
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current.getCurrentRoute().name;

        actions.setCurrentRouteName(currentRouteName);
      }}
      ref={navigationRef}
      linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {appSessionInfo == 'shortcode' || appSessionInfo == 'show_shortcode' ? (
          <Stack.Screen
            name={navigationStrings.SHORT_CODE}
            component={ShortCode}
          />
        ) : appSessionInfo == 'app_intro' ? (
          <Stack.Screen
            name={navigationStrings.APP_INTRO}
            component={AppIntro}
            options={{gestureEnabled: false}}
          />
        ) : appSessionInfo == 'guest_login' || !!userData?.auth_token ? (
          <React.Fragment>
            {businessType === 10 ? (
              <Stack.Screen
                name={navigationStrings.DRAWER_ROUTES}
                component={DrawerRoutes}
                options={{gestureEnabled: false}}
              />
            ) : (
              <Stack.Screen
                name={navigationStrings.TAB_ROUTES}
                component={
                  appData?.profile?.preferences?.is_rental_weekly_monthly_price
                    ? TabRoutesP2pOnDemand
                    : businessType === 4
                    ? TaxiTabRoutes
                    : businessType === 8
                    ? TabRoutesP2p
                    : businessType === 10
                    ? TabRoutesEcommerce
                    : TabRoutes
                }
                options={{gestureEnabled: false}}
              />
            )}
          </React.Fragment>
        ) : (
          AuthStack(Stack, appStyle, appData)
        )}

        {CourierStack(Stack)}

        {/* {TaxiAppStack(Stack)} */}

        <Stack.Screen
          name={navigationStrings.CHAT_SCREEN}
          component={
            appData?.profile?.preferences?.is_rental_weekly_monthly_price
              ? P2pChatScreen
              : ChatScreen
          }
        />
        <Stack.Screen
          name={navigationStrings.CHAT_SCREEN_FOR_VENDOR}
          component={ChatScreenForVendor}
        />
        <Stack.Screen
          name={navigationStrings.CHAT_ROOM}
          component={
            appData?.profile?.preferences?.is_rental_weekly_monthly_price
              ? P2pChatRoom
              : ChatRoom
          }
        />
        <Stack.Screen
          name={navigationStrings.CHAT_ROOM_FOR_VENDOR}
          component={ChatRoomForVendor}
        />

        <Stack.Screen
          name={navigationStrings.TABROUTESVENDOR}
          component={TabRoutesVendor}
          options={{gestureEnabled: false}}
        />
        <Stack.Screen
          name={navigationStrings.TABROUTESVENDORNEW}
          component={TabRoutesVendorNewTemplate}
          options={{gestureEnabled: false}}
        />
        <Stack.Screen
          name={navigationStrings.ADDADDRESS}
          // component={Addaddress}
          component={Addaddress2}
        />

        {/* <Stack.Screen
          name={navigationStrings.addAddress}
          component={BottomTabBar}
          options={{ gestureEnabled: false }}
        /> */}

        {/* <Stack.Screen
          name={navigationStrings.LEADER_BOARD}
          component={LeaderBoard}
          options={{gestureEnabled: false}}
        />
        <Stack.Screen
          name={navigationStrings.WATCH}
          component={Watch}
          options={{gestureEnabled: false}}
        /> */}
        <Stack.Screen
          name={navigationStrings.MYFATOORAH}
          component={MyFatoorah}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
