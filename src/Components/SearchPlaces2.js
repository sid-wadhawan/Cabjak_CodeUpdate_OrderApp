import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  Keyboard,
  I18nManager,
  Text,
  Alert,
} from 'react-native';
import {useDarkMode} from 'react-native-dynamic';
import {useSelector} from 'react-redux';
import imagePath from '../constants/imagePath';
import colors from '../styles/colors';
import fontFamily from '../styles/fontFamily';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../styles/responsiveSize';
import {googlePlacesApi} from '../utils/googlePlaceApi';
import SelctFromMap from './SelctFromMap';
import ModalView from '../Components/Modal';
import strings from '../constants/lang';
import * as RNLocalize from 'react-native-localize';
import actions from '../redux/actions';
import {showError} from '../utils/helperFunctions';

const SearchPlaces = ({
  containerStyle = {},
  inputStyle = {},
  mapKey = '',
  fetchArrayResult = () => {},
  value = '',
  setValue = () => {},
  placeHolder,
  onFocus = () => {},
  autoFocus = false,
  _moveToNextScreen = () => {},
  curLatLng = {},
  placeHolderColor = colors.black,
  onClear = () => {},
  showRightImg = true,
  textStyle = {},
  mapClose = () => {},
  addressDone = () => {},
  isMapSelectLocation = false,
  currentLatLong = {},
  index = 0,
  isTaxiFlow = false,
  onSubmit = Keyboard.dismiss,
}) => {
  const {appData, currencies, languages, themeColor, themeToggle} = useSelector(
    state => state?.initBoot,
  );

  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;

  const textChangeHandler = async data => {
    setValue(data);
    if (!!appData?.profile?.preferences?.is_static_dropoff && index !== 0) {
      let query = {};
      query['search'] = data;
      actions
        .pickuplocationSearch(query, {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        })
        .then(res => {
          console.log(res, 'ressssssss');
          if (res && !!res.data) {
            let arry = res.data.map((val, i) => {
              return {
                ...val,
                formatted_address: val?.address,
                name: val?.title,
              };
            });
            fetchArrayResult(arry);
          }
        })
        .catch(error => console.error(error, 'errrorrrr'));
    } else {
      var res = await googlePlacesApi(
        data,
        mapKey,
        curLatLng,
        RNLocalize.getCountry(),
      );
      if (res && !!res.predictions) {
        let arry = res.predictions.map((val, i) => {
          return {
            ...val,
            formatted_address: val?.description,
            name: val?.structured_formatting.main_text,
          };
        });
        fetchArrayResult(arry);
      }
    }
  };

  const modalMainContent = () => {
    return (
      <View style={{flex: 1}}>
        <SelctFromMap
          addressDone={addressDone}
          mapClose={mapClose} //address map close
          constCurrLoc={currentLatLong}
        />
      </View>
    );
  };

  return (
    <>
      <View
        style={{
          ...styles.container,
          backgroundColor: isDarkMode ? colors.whiteOpacity15 : colors.greyNew,
          ...containerStyle,
          marginTop: moderateScaleVertical(12),
        }}>
        <TextInput
          autoFocus={autoFocus}
          value={value}
          placeholder={placeHolder}
          onChangeText={textChangeHandler}
          style={{
            ...styles.text,
            color: isDarkMode ? colors.textGreyB : colors.black,
            ...textStyle,
          }}
          onSubmitEditing={onSubmit}
          onFocus={onFocus}
          placeholderTextColor={
            isDarkMode ? colors.textGreyB : placeHolderColor
          }
          returnKeyType="Done"
        />
        {value !== '' && (
          <TouchableOpacity
            onPress={onClear}
            activeOpacity={0.8}
            style={{marginRight: moderateScale(8)}}>
            <Image
              style={{
                height: moderateScale(18),
                width: moderateScale(18),
              }}
              resizeMode="contain"
              source={imagePath.closeButton}
            />
          </TouchableOpacity>
        )}
        {!!showRightImg && !appData?.profile?.preferences?.is_static_dropoff ? (
          <TouchableOpacity onPress={_moveToNextScreen}>
            <Image
              style={{
                height: moderateScale(24),
                width: moderateScale(24),
              }}
              source={imagePath.blackNav}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <ModalView
        isVisible={isMapSelectLocation}
        onClose={mapClose}
        modalMainContent={modalMainContent}
        mainViewStyle={{flex: 1}}
        modalStyle={{
          flex: 1,
          marginVertical: 0,
          marginHorizontal: 0,
        }}
      />
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: moderateScale(44),
    backgroundColor: 'gray',
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(8),
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.medium,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    fontSize: textScale(11),
  },
});

export default React.memo(SearchPlaces);
