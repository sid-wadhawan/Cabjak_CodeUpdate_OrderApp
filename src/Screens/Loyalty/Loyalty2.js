import {MotiView} from 'moti';
import React, {useState} from 'react';
import {Image, Text, View} from 'react-native';
import {useDarkMode} from 'react-native-dynamic';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import Header from '../../Components/Header';
import {loaderOne} from '../../Components/Loaders/AnimatedLoaderFiles';
import WrapperContainer from '../../Components/WrapperContainer';
import imagePath from '../../constants/imagePath';
import strings from '../../constants/lang/index';
import colors from '../../styles/colors';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import commonStylesFunc from '../../styles/commonStyles';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../styles/responsiveSize';
import {MyDarkTheme} from '../../styles/theme';
import stylesFun from './styles';

export default function Loyalty({navigation}) {
  const theme = useSelector(state => state?.initBoot?.themeColor);
  const toggleTheme = useSelector(state => state?.initBoot?.themeToggle);
  const darkthemeusingDevice = useDarkMode();
  const isDarkMode = toggleTheme ? darkthemeusingDevice : theme;
  const userData = useSelector(state => state.auth.userData);

  const [state, setState] = useState({
    isLoading: false,
    loyaltyPointsEarned: !!userData?.avg_rating
      ? Number(userData?.avg_rating) * 1000
      : 0,
  });
  const {isLoading, loyaltyPointsEarned} = state;

  // Redux Store Data
  const {appData, appStyle} = useSelector(state => state?.initBoot);
  const fontFamily = appStyle?.fontSizeData;
  const styles = stylesFun({fontFamily, isDarkMode, MyDarkTheme});
  const commonStyles = commonStylesFunc({fontFamily});

  const getLoyaltyGrade = points => {
    if (loyaltyPointsEarned >= 4000) return strings.CONGRATS;
    if (loyaltyPointsEarned >= 2500) return strings.PROGRESSGOLD;
    return strings.PROGRESSSILVER ;
  };

  return (
    <WrapperContainer
      bgColor={isDarkMode ? MyDarkTheme.colors.background : colors.white}
      statusBarColor={'#1E1B1B'}
      barStyle={'light-content'}
      source={loaderOne}
      isLoadingB={isLoading}>
      {/* Header */}
      <LinearGradient
        // colors={['#CE1126', '#FFFFFF', '#007A3D']}
        // locations={[0, 0.5, 1]}
        // start={{ x: 0, y: 0 }}
        // end={{ x: 1, y: 0 }}
        colors={['#1E1B1B', '#000000']}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
        style={{flex: 1, alignItems: 'center'}}>
        <Header
          leftIcon={imagePath.back}
          centerTitle={strings.LOYALTY}
          textStyle={{
            fontSize: textScale(16),
            fontWeight: '600',
            color: colors.whiteSmokeColor,
          }}
          // headerStyle={{
          //   backgroundColor: colors.themeColor,
          // }}
          leftIconStyle={{tintColor: colors.whiteSmokeColor}}
        />

        <View style={{marginTop: moderateScaleVertical(50)}} />
        <AnimatedCircularProgress
          size={width / 1.5}
          width={moderateScale(15)}
          fill={(loyaltyPointsEarned / 5000) * 100} // progress %
          tintColor={
            loyaltyPointsEarned >= 4000
              ? '#FDC345'
              : loyaltyPointsEarned >= 2500
              ? '#BABDBC'
              : '#B2814B'
          }
          backgroundColor={
            loyaltyPointsEarned >= 4000
              ? '#987A3C'
              : loyaltyPointsEarned >= 2500
              ? '#777878'
              : '#73593F'
          }
          rotation={0}
          lineCap="butt">
          {() => (
            <Image
              source={
                loyaltyPointsEarned >= 4000
                  ? imagePath.newgoldLoyal
                  : loyaltyPointsEarned >= 2500
                  ? imagePath.newsilverLoyal
                  : imagePath.newbronzeLoyal
              }
              style={{width: '74%', height: '74%', resizeMode: 'contain'}}
            />
          )}
        </AnimatedCircularProgress>
        {/* <MotiView
          from={{scale: 0.9, opacity: 1}}
          animate={{scale: 1, opacity: 1}}
          transition={{loop: true, type: 'timing', duration: 2000}}
          style={{
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
            shadowColor: colors.blackOpacity70,
            shadowOpacity: 0.8,
            shadowRadius: 20,
          }}>
          <Image
            source={
              loyaltyPointsEarned >= 4000
                ? imagePath.newgoldLoyal
                : loyaltyPointsEarned >= 2500
                ?imagePath.newsilverLoyal
                : imagePath.newbronzeLoyal
            }
            style={{width: '80%', height: '80%', resizeMode: 'contain'}}
          />
        </MotiView> */}
        {/* <MotiView
          from={{ rotate: "0deg" }}
          animate={{ rotate: "360deg" }}
          transition={{ loop: true, duration: 8000 }}
          style={{
            position: "absolute",
            width: width * 0.65,
            height: width * 0.65,
            borderRadius: width,
            borderWidth: 10,
            borderColor: "#FFD700", // gold-yellow
            borderStyle: "dashed",
          }}
        /> */}

        {/* Points */}
        <MotiView
          from={{opacity: 0, translateY: 20}}
          animate={{opacity: 1, translateY: 0}}
          transition={{type: 'timing', duration: 800}}
          style={{marginTop: moderateScaleVertical(40)}}>
          <LinearGradient
            colors={
              loyaltyPointsEarned >= 4000
                ? ['#FDC345', '#FDC345']
                : loyaltyPointsEarned >= 2500
                ? ['#BABDBC', '#BABDBC']
                : ['#B2814B', '#B2814B']
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{
              borderRadius: moderateScale(50),
              paddingHorizontal: moderateScale(50),
              paddingVertical: moderateScale(10),
              alignSelf: 'center',
              marginBottom: moderateScaleVertical(8),
            }}>
            <Text
              style={{
                fontSize: textScale(16),
                fontFamily: fontFamily.bold,
                color:
                  loyaltyPointsEarned >= 4000
                    ? colors.black
                    : loyaltyPointsEarned >= 2500
                    ? colors.black
                    : colors.whiteSmokeColor,
                textAlign: 'center',
              }}>
              {/* {Math.trunc(loyaltyPointsEarned)} Level */}
              {loyaltyPointsEarned >= 4000
                ? strings.GOLD
                : loyaltyPointsEarned >= 2500
                ? strings.SILVER
                : strings.BRONZE}
            </Text>
          </LinearGradient>

          <Text
            style={{
              fontSize: textScale(13),
              fontFamily: fontFamily.bold,
              color: '#bbb',
              textAlign: 'center',
              marginTop: moderateScaleVertical(10),
            }}>
            {getLoyaltyGrade()}
          </Text>
        </MotiView>
        <View style={{marginTop: moderateScaleVertical(6)}}>
          <Text
            style={{
              fontSize: textScale(42),
              fontFamily: fontFamily.regular,
              color: colors.whiteSmokeColor,
              textAlign: 'center',
            }}>
            {Math.trunc(loyaltyPointsEarned)}
          </Text>
          <Text
            style={{
              fontSize: textScale(12),
              fontFamily: fontFamily.medium,
              color: '#bbb',
              textAlign: 'center',
              marginTop: moderateScaleVertical(8),
            }}>
            {strings.OUTOF} 5000
          </Text>
        </View>

        {/* Progress Bar */}
        {/* <View
          style={{
            marginTop: moderateScaleVertical(30),
            width: width * 0.75,
            height: moderateScaleVertical(14),
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={['#00e68a', '#00b26b', '#005f3b']}
            style={{
              width: `${(loyaltyPointsEarned / 5000) * 100}%`,
              height: '100%',
              borderRadius: 20,
            }}
          />
        </View> */}
        {/* <View
          style={{
            flexDirection: 'row',
            width: width * 0.75,
            marginTop: moderateScaleVertical(6),
          }}>
          <View
            style={{
              width: '48.5%',
              alignItems: 'center',
              borderEndWidth: moderateScale(1.4),
              borderColor: '#bbb',
            }}>
            <Text style={{color: '#bbb', fontFamily: fontFamily.bold}}>
              Bronze
            </Text>
          </View>
          <View
            style={{
              width: '30%',
              alignItems: 'center',
              borderEndWidth: moderateScale(1.4),
              borderColor: '#bbb',
            }}>
            <Text style={{color: '#bbb', fontFamily: fontFamily.bold}}>
              Silver
            </Text>
          </View>
          <View style={{width: '20%', alignItems: 'center'}}>
            <Text style={{color: '#bbb', fontFamily: fontFamily.bold}}>
              Gold
            </Text>
          </View>
        </View> */}
      </LinearGradient>
    </WrapperContainer>
  );
}
