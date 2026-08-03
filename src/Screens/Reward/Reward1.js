import {useFocusEffect} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {BarIndicator} from 'react-native-indicators';
import {useSelector} from 'react-redux';
import imagePath from '../../constants/imagePath';
import navigationStrings from '../../navigation/navigationStrings';
import actions from '../../redux/actions';
import colors from '../../styles/colors';
import Modal from 'react-native-modal';

import {
  height,
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../styles/responsiveSize';
import {getImageUrl} from '../../utils/helperFunctions';
import styles from './style';
import {hitSlopProp} from '../../styles/commonStyles';
import fontFamily from '../../styles/fontFamily';
import FastImage from 'react-native-fast-image';
import strings from '../../constants/lang';

export default function Reward1({navigation}) {
  const Seprator = () => {
    return <View style={{marginVertical: moderateScale(15)}} />;
  };
  const userData = useSelector(state => state.auth.userData);
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorialModal, setshowTutorialModal] = useState(true);
  const [bannerData, setbannerData] = useState({});
  const [messagepopup, setmessagepopup] = useState('');
  const [showsecondModal, setshowsecondModal] = useState(false);
  const {
    themeColors,
    appStyle,
    appData,
    shortCodeStatus,
    languages,
    currencies,
  } = useSelector(state => state?.initBoot);
  const [data, setData] = useState([]);
  const imageUrl = getImageUrl(
    appData?.profile?.logo?.image_fit,
    appData?.profile?.logo?.image_path,
    '1000/1000',
  );

  useEffect(() => {
    if (userData?.auth_token) {
      getRewardsTypes();
    } else {
      actions.setAppSessionData('on_login');
    }
  }, []);

  const getRewardsTypes = () => {
    setIsLoading(true);
    actions
      .getRewardsType(
        {},
        {
          code: appData?.profile?.code,
          currency: currencies?.primary_currency?.id,
          language: languages?.primary_language?.id,
        },
      )
      .then(res => {
        setData(res?.data?.offers);
        if (res?.data?.show_pop) {
          setTimeout(() => {
            setmessagepopup(res?.data?.show_pop_message);
          }, 200);

          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
        if (!res?.data?.show_pop) {
          setshowsecondModal(true);
        }
        if (res?.data?.settings?.is_enabled) {
          setTimeout(() => {
            setbannerData(res?.data?.settings);
          }, 400);

          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        } else {
          setIsLoading(false);
        }
      })
      .catch(err => setIsLoading(false));
  };
  const reverseData = [...data];
  return (
    <SafeAreaView
      style={{backgroundColor: colors.blackOpacity05, height: '100%'}}>
      <View
        style={{
          marginTop:
            Platform.OS === 'ios'
              ? moderateScaleVertical(-34)
              : moderateScaleVertical(16),
        }}>
        {isLoading ? (
          <View
            style={{
              marginTop: height / 3,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <BarIndicator
              color={themeColors?.primary_color}
              size={moderateScale(30)}
            />
          </View>
        ) : (
          <FlatList
            data={reverseData}
            scrollEnabled={false}
            bounces={false}
            ListFooterComponent={() => (
              <View style={{marginTop: moderateScaleVertical(20)}} />
            )}
            ListHeaderComponent={() => (
              <View style={{marginTop: moderateScaleVertical(20)}} />
            )}
            ItemSeparatorComponent={Seprator}
            style={{marginTop: moderateScaleVertical(40)}}
            keyExtractor={item => item.id.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setTimeout(() => {
                    navigation.navigate(navigationStrings.LEADER_BOARD, {item});
                  }, 100);
                }}>
                <View style={styles.parentContainer}>
                  <LinearGradient
                    colors={
                      item?.slug == 'today'
                        ? ['#d5a887', '#c99474', '#b16c4d']
                        : item?.slug == 'weekly'
                        ? ['#e2e1dd', '#c2bfba', '#918e89']
                        : item?.slug == 'monthly'
                        ? ['#f6db89', '#e5b959', '#cf8e28']
                        : ['#d5a887', '#c99474', '#b16c4d']
                    }
                    start={{x: 0, y: 0.4}}
                    end={{x: 0.6, y: 0}}
                    // locations={[0.35, 0, 1]}
                    style={styles.container}>
                    <Image
                      style={{
                        height: moderateScaleVertical(48),
                        width: moderateScale(62),
                        marginLeft: moderateScale(8),
                      }}
                      source={
                        item?.slug == 'monthly'
                          ? imagePath.icBadge1
                          : item?.slug == 'weekly'
                          ? imagePath.icBadge2
                          : imagePath.icBadge3
                      }
                    />
                    <Text
                      style={{
                        ...styles.text,
                        fontSize: textScale(13),
                        color: colors.blackOpacity43,
                        textTransform: 'uppercase',
                        fontFamily: fontFamily.circularBold,
                      }}>
                      {item?.slug == 'today'
                        ? strings.DAILY_REWARDS
                        : item?.slug == 'weekly'
                        ? strings.WEEKLY_REWARDS
                        : item?.slug == 'monthly'
                        ? strings.MONTHLY_REWARDS
                        : item?.type_name}
                    </Text>
                    <Image
                      source={imagePath?.icLeftArrow}
                      style={{
                        tintColor: 'black',
                        height: moderateScale(14),
                        width: moderateScale(14),
                      }}
                    />
                  </LinearGradient>
                  <View
                    style={{
                      flexDirection: 'row',
                      flex: 1,
                      alignItems: 'center',
                      paddingHorizontal: moderateScale(10),
                      borderRadius: moderateScale(35),
                      overflow: 'hidden',
                    }}>
                    {/* <View style={{flex: 0.8}}>
                    <Text numberOfLines={2} style={styles.belowText}>
                      Ist Prize and more...
                    </Text>
                  </View> */}
                    <View
                      style={{
                        flex: 1,
                        // alignItems: 'flex-end',
                        // marginRight: moderateScale(24),
                        alignItems: 'center',
                      }}>
                      <FastImage
                        resizeMode={FastImage.resizeMode.contain}
                        style={{
                          width: '100%',
                          height: '90%',
                        }}
                        source={{
                          uri: item?.image,
                          priority: FastImage.priority.high,
                          cache: FastImage.cacheControl.immutable,
                        }}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <Modal
        isVisible={!!messagepopup.length}
        backdropOpacity={0.3}
        animationIn={'fadeInUp'}
        animationOut={'fadeOutUp'}
        animationInTiming={600}
        animationOutTiming={600}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginTop: moderateScaleVertical(30),
        }}>
        <View
          style={{
            borderRadius: moderateScale(18),
            overflow: 'hidden',
            width: width * 0.82,
            maxHeight: height * 0.85,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 10,
            backgroundColor: colors.white,
          }}>
          <Text
            style={{
              fontFamily: fontFamily.circularBold,
              alignSelf: 'center',
              marginTop: moderateScaleVertical(50),
              marginBottom: moderateScaleVertical(20),
              fontSize: textScale(15),
              color: colors.textGreyD,
              lineHeight: moderateScaleVertical(22),
            }}>
            {messagepopup}
          </Text>

          <Pressable
            onPress={() => {
              setmessagepopup('');
              setTimeout(() => {
                setshowsecondModal(true);
              }, 800);
            }}
            style={{
              position: 'absolute',
              top: moderateScale(10),
              right: moderateScale(10),
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: moderateScale(20),
              padding: moderateScale(2),
              zIndex: 2,
            }}>
            <Image
              source={imagePath.crossCancel}
              style={{
                width: moderateScale(20),
                height: moderateScale(20),
                tintColor: colors.whiteOpacity77,
              }}
            />
          </Pressable>
        </View>
      </Modal>
      {bannerData?.image && showsecondModal && messagepopup === '' ? (
        <Modal
          isVisible={showTutorialModal}
          backdropOpacity={0.3}
          animationIn={'fadeInUp'}
          animationOut={'fadeOutDown'}
          animationInTiming={600}
          animationOutTiming={600}
          style={{margin: 0, justifyContent: 'center', alignItems: 'center'}}>
          <View
            style={{
              borderRadius: moderateScale(18),
              overflow: 'hidden',
              width: width * 0.82,
              maxHeight: height * 0.85,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}>
            <FastImage
              source={{
                uri:
                  languages?.primary_language?.sort_code === 'ar'
                    ? bannerData?.image_arabic
                    : bannerData?.image,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              resizeMode={FastImage.resizeMode.cover}
              style={{
                width: '100%',
                backgroundColor: colors.blackB,
                height: height * 0.55, // auto-fit for portrait or landscape
              }}
            />

            <Pressable
              onPress={() => setshowTutorialModal(false)}
              style={{
                position: 'absolute',
                top: moderateScale(10),
                right: moderateScale(10),
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: moderateScale(20),
                padding: moderateScale(2),
                zIndex: 2,
              }}>
              <Image
                source={imagePath.crossCancel}
                style={{
                  width: moderateScale(20),
                  height: moderateScale(20),
                  tintColor: colors.whiteOpacity77,
                }}
              />
            </Pressable>
          </View>
        </Modal>
      ) : (
        <></>
      )}
    </SafeAreaView>
  );
}
