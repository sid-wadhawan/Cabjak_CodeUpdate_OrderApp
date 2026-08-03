import {StyleSheet} from 'react-native';
import {
  height,
  moderateScale,
  textScale,
  verticalScale,
  width,
} from '../../styles/responsiveSize';
import colors from '../../styles/colors';
import fontFamily from '../../styles/fontFamily';
const styles = StyleSheet.create({
  safeAreaContainer: {backgroundColor: colors.borderColorGrey, height: '100%'},
  container: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: moderateScale(25),
    justifyContent: 'space-between',
    alignItems:'center'
  },
  flatlistContainer: {
    marginHorizontal: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    borderTopLeftRadius: moderateScale(30),
    zIndex:20
  },
  numberText: {
    fontSize: textScale(20),
    color: '#b00404',
    fontWeight: '600',
  },
  namePoints: {flexDirection: 'column', flex: 0.7},
  name: {fontSize: textScale(14), fontFamily:fontFamily.circularMedium,textTransform:'uppercase'},

  points: {fontSize: textScale(9),fontFamily:fontFamily.circularBold},
  voucherCardContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 0.3,
  },
  voucherText: {fontSize: textScale(15)},
});
export default styles;
