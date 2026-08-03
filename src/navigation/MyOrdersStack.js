import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {useSelector} from 'react-redux';
import {
  MyOrders,
  Notifications,
  OrderDetail,
  PaymentOptions,
  PickupTaxiOrderDetail,
  RateOrder,
} from '../Screens';
import navigationStrings from './navigationStrings';
// import PickupTaxiOrderDetail from '../Screens/TaxiApp/PickupTaxiOrderDetail/PIckupTaxiOrderDetail2';

const Stack = createNativeStackNavigator();
export default function ({navigation}) {
  const {appData, appStyle} = useSelector(state => state?.initBoot);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name={navigationStrings.MY_ORDERS} component={MyOrders} />
      <Stack.Screen
        name={navigationStrings.ORDER_DETAIL}
        component={OrderDetail}
      />
      <Stack.Screen
        name={navigationStrings.PICKUPTAXIORDERDETAILS}
        component={PickupTaxiOrderDetail}
        options={{headerShown: false, unmountOnBlur: false}}
      />
      <Stack.Screen
        name={navigationStrings.RATEORDER}
        component={RateOrder}
        options={{headerShown: false, unmountOnBlur: false}}
      />
      <Stack.Screen
        name={navigationStrings.NOTIFICATION}
        component={Notifications}
      />
       <Stack.Screen
        name={navigationStrings.PAYMENT_OPTIONS}
        component={PaymentOptions}
      />
    </Stack.Navigator>
  );
}
