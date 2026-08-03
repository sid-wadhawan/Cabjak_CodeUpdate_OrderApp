import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {useSelector} from 'react-redux';
import {MyOrders, OrderDetail, Reward1} from '../Screens';
import navigationStrings from './navigationStrings';
// import {LEADER_BOARD} from '../config/urls';
import LeaderBoard from '../Screens/LeaderBoard/LeaderBoard';
import Watch from '../Screens/Watch/Watch';

const Stack = createNativeStackNavigator();
export default function ({navigation}) {
  const {appData, appStyle} = useSelector(state => state?.initBoot);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name={navigationStrings.REWARD1} component={Reward1} />
      <Stack.Screen
        name={navigationStrings.LEADER_BOARD}
        component={LeaderBoard}
      />
      <Stack.Screen name={navigationStrings.WATCH} component={Watch} />
    </Stack.Navigator>
  );
}
