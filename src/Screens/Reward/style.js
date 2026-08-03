import {StyleSheet} from 'react-native';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
  width,
} from '../../styles/responsiveSize';
import fontFamily from '../../styles/fontFamily';
import colors from '../../styles/colors';
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(12),
    paddingVertical:moderateScaleVertical(6),
    borderRadius: moderateScale(24),
  },
  img: {
    width: width / 4,
    height: height / 14,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  parentContainer: {
    backgroundColor: 'white',
    marginHorizontal: moderateScale(38),
    borderRadius: moderateScale(35),
    height: height / 4.5,
    elevation:moderateScale(4),
    shadowColor:colors.blackOpacity66,
    shadowOffset:{height:0, width:0},
    shadowOpacity:0.4,
    shadowRadius:6
  },
  text: {
    fontWeight: '500',
  },
  belowText: {
    // textAlign: 'center',
    // marginTop: moderateScaleVertical(20),
    fontSize: textScale(12),
    fontFamily:fontFamily.circularMedium
  },
});
export default styles;
