import {useIsFocused} from '@react-navigation/native';
import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  I18nManager,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import WrapperContainer from '../../Components/WrapperContainer';
import imagePath from '../../constants/imagePath';
import navigationStrings from '../../navigation/navigationStrings';
import actions from '../../redux/actions';
import colors from '../../styles/colors';
import fontFamily from '../../styles/fontFamily';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../styles/responsiveSize';
import {getImageUrl, showInfo} from '../../utils/helperFunctions';
// import { Image } from 'react-native-elements/dist/image/Image';
import Modal from 'react-native-modal';
import styles from './style';

import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import strings from '../../constants/lang';

export default function LeaderBoard({navigation, route}) {
  const {themeColors, appData, languages, currencies} = useSelector(
    state => state?.initBoot,
  );
  const [link, setLink] = useState();
  const [user, setUser] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState();
  const [showpointsModal, setshowpointsModal] = useState(false);
  const [userPoints, setuserPoints] = useState([]);
  const paramsData = route?.params?.item;
  console.log(route, 'routeroute');
  const [filterData, setFilterData] = useState({
    id: paramsData?.type,
    value: paramsData?.type_name,
    slug: paramsData?.slug,
  });
  const [filter, seltFiilter] = useState([
    {id: 0, value: 'Daily Rewards', slug: 'today'},
    {id: 1, value: 'Weekly Rewards', slug: 'weekly'},
    {id: 2, value: 'Monthly Rewards', slug: 'monthly'},
  ]);
  const userData = useSelector(state => state.auth.userData);
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onShare = async () => {
    const options = {
      message: `${strings.SHARELINE1} ${userData?.refferal_code} ${strings.SHARELINE2}`,
      url: `https://order.cabjak.com/getapp`,
      // url:
      //   Platform.OS === 'ios'
      //     ? `https://apps.apple.com/us/app/cabjak/id6749265440`
      //     : `https://play.google.com/store/apps/details?id=com.cabjak.OrderApp`,
    };

    try {
      const result = await Share.open(options);
    } catch (error) {
      if (error.message === 'User did not share') {
        null;
      } else {
        null;
      }
    }
  };

  const animateList = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (userData?.auth_token) {
      setIsLoading(true);
      let headers = {
        code: appData?.profile?.code,
        currency: currencies?.primary_currency?.id,
        language: languages?.primary_language?.id,
      };
      actions
        .getUserPointsLeaderboard(`?day_type=${filterData.slug}`, {}, headers)
        .then(res => {
          setuserPoints(res?.data);
        })
        .catch(err => {});

      actions
        .leaderBoarrd(`?day_type=${filterData?.slug}`, {}, headers)
        .then(res => {
          setLink(res?.data?.share_refer_link);
          setUser(res?.data?.users);
          setIsLoading(false);
          setData(res?.data);
          animateList();
        })
        .catch(err => {
          setIsLoading(false);
          animateList();
        });
    } else {
      actions.setAppSessionData('on_login');
    }
  }, [filterData, isFocused]);

  const imageUrl = getImageUrl(
    appData?.profile?.logo?.image_fit,
    appData?.profile?.logo?.image_path,
    '1000/1000',
  );

  return (
    <WrapperContainer isLoading={isLoading} bgColor={colors.blackOpacity05}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: moderateScale(16),
          marginBottom: moderateScale(10),
        }}>
        <TouchableOpacity
          style={{flex: 0.1}}
          onPress={() => navigation.goBack()}>
          <Image source={imagePath?.backRoyo} />
        </TouchableOpacity>
        <View style={{height: moderateScaleVertical(50)}} />
      </View>
      <View style={styles.flatlistContainer}>
        <View
          style={{
            flexDirection: 'row',
            flex: 1,
          }}>
          <LinearGradient
            colors={
              filterData?.slug == 'monthly'
                ? ['#c2bfba', '#918e89']
                : filterData?.slug == 'today'
                ? ['#e5b959', '#cf8e28']
                : ['#c99474', '#b16c4d']
            }
            style={{
              flex: 0.5,
              height: height / 16.9,
              justifyContent: 'center',
              borderRadius: moderateScale(30),
              paddingLeft: moderateScale(15),
              shadowColor: colors.black,
              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <TouchableOpacity
              onPress={() => {
                filter.map((item, inex) => {
                  if (filterData?.slug == item?.slug) {
                    if (inex > 0 && inex < 3) {
                      setFilterData(filter[inex - 1]);
                    } else {
                      setFilterData(filter[2]);
                    }
                  }
                });
              }}>
              <Image
                source={imagePath.icLeftArrow}
                style={{tintColor: 'white', transform: [{rotate: '180deg'}]}}
              />
            </TouchableOpacity>
          </LinearGradient>
          {/* left arrow  */}
          <LinearGradient
            colors={
              filterData?.slug == 'weekly'
                ? ['#e5b959', '#cf8e28']
                : filterData?.slug == 'monthly'
                ? ['#c99474', '#b16c4d']
                : ['#c2bfba', '#918e89']
            }
            style={{
              flex: 0.5,
              alignItems: 'flex-end',
              height: height / 16.9,
              justifyContent: 'center',
              borderRadius: moderateScale(30),
              paddingRight: moderateScale(15),
              shadowColor: colors.black,
              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <TouchableOpacity
              onPress={() => {
                filter.map((item, inex) => {
                  if (filterData?.slug == item?.slug) {
                    if (inex < 2) {
                      setFilterData(filter[inex + 1]);
                    } else {
                      setFilterData(filter[0]);
                    }
                  }
                });
              }}>
              <Image
                source={imagePath.icLeftArrow}
                style={{tintColor: 'white'}}
              />
            </TouchableOpacity>
          </LinearGradient>
          {/* monthly weekly reward  */}
          <LinearGradient
            colors={
              filterData?.slug == 'today'
                ? ['#d5a887', '#c99474', '#b16c4d']
                : filterData?.slug == 'weekly'
                ? ['#e2e1dd', '#c2bfba', '#918e89']
                : ['#f6db89', '#e5b959', '#cf8e28']
            }
            start={{x: 0, y: 0.4}}
            end={{x: 0.6, y: 0}}
            style={{
              width: '75%',
              position: 'absolute',
              top: moderateScale(-4),
              left: moderateScale(40),
              height: height / 14,
              borderRadius: moderateScale(35),
              justifyContent: 'center',
              shadowColor: colors.black,
              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={{flexDirection: 'row', alignItems: 'center'}}
              onPress={() => {
                filter.map((item, inex) => {
                  if (filterData?.slug == item?.slug) {
                    if (inex < 2) {
                      setFilterData(filter[inex + 1]);
                    } else {
                      setFilterData(filter[0]);
                    }
                  }
                });
              }}>
              <Image
                style={{
                  height: moderateScaleVertical(44),
                  width: moderateScale(56),
                  marginLeft: moderateScale(8),
                  resizeMode: 'contain',
                }}
                source={
                  filterData?.slug == 'today'
                    ? imagePath.icBadge3
                    : filterData?.slug == 'weekly'
                    ? imagePath.icBadge2
                    : imagePath.icBadge1
                }
              />
              <Text
                style={{
                  left: I18nManager.isRTL
                    ? moderateScale(20)
                    : filterData?.slug == 'monthly'
                    ? moderateScale(2)
                    : moderateScale(8),
                  fontSize: textScale(12.4),
                  fontFamily: fontFamily.circularBold,
                  textTransform: 'uppercase',
                  color: colors.blackOpacity43,
                }}>
                {filterData?.slug == 'today'
                  ? strings.DAILY_REWARDS
                  : filterData?.slug == 'weekly'
                  ? strings.WEEKLY_REWARDS
                  : filterData?.slug == 'monthly'
                  ? strings.MONTHLY_REWARDS
                  : filterData?.value}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
      {isLoading ? null : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{
              flex: 1,
              paddingTop: moderateScaleVertical(44),
              marginTop: moderateScaleVertical(26),
            }}>
            <FlatList
              data={user}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <Text
                  style={{
                    alignSelf: 'center',
                    fontSize: textScale(15),
                    marginTop: moderateScaleVertical(100),
                    fontFamily: fontFamily.circularMedium,
                  }}>
                  {strings.COMINGSOON}
                </Text>
              )}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    width: '90%',
                    alignSelf: 'center',
                    marginBottom:
                      Platform.OS == 'ios'
                        ? moderateScaleVertical(8)
                        : moderateScaleVertical(4),
                  }}
                />
              )}
              keyExtractor={item => item?.id?.toString()}
              renderItem={({item, index}) => {
                return (
                  <Animated.View
                    style={{
                      flexDirection: 'row',
                      height: moderateScaleVertical(66),
                      alignItems: 'center',
                      paddingVertical: moderateScaleVertical(10),
                      paddingHorizontal: moderateScale(10),
                      backgroundColor: '#fff',
                      borderRadius: moderateScale(16),
                      marginHorizontal: moderateScale(34),
                      marginVertical: moderateScaleVertical(4),
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    }}>
                    {/* Date */}
                    <View style={{flex: 0.25, alignItems: 'flex-start'}}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: textScale(9.4),
                          color: colors.grayOpacity51,
                          fontFamily: fontFamily.regular,
                        }}>
                        {!!item?.rank_date_time
                          ? moment(item?.rank_date_time).format(
                              'hh:mm:ss DD/MM/YY',
                            )
                          : strings.NONE}
                      </Text>
                    </View>

                    {/* Serial Number in Gradient Circle */}
                    <LinearGradient
                      colors={
                        filterData?.slug == 'today'
                          ? ['#d5a887', '#c99474', '#b16c4d']
                          : filterData?.slug == 'weekly'
                          ? ['#e2e1dd', '#c2bfba', '#918e89']
                          : ['#f6db89', '#e5b959', '#cf8e28']
                      }
                      style={{
                        width: moderateScale(32),
                        height: moderateScale(32),
                        borderRadius: moderateScale(16),
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: moderateScale(10),
                      }}>
                      <Text
                        style={{
                          fontFamily: fontFamily.circularBold,
                          color: '#fff',
                          fontSize: textScale(14),
                        }}>
                        {index + 1}
                      </Text>
                    </LinearGradient>

                    {/* User Name */}
                    <View style={{flex: 0.5}}>
                      <Text
                        style={{
                          fontFamily: fontFamily.circularBold,
                          fontSize: textScale(13),
                          color: colors.blackLight,
                          textAlign: 'left',
                        }}>
                        {item.name}
                      </Text>
                    </View>

                    {/* Points Card */}
                    <View
                      style={{
                        flex: 0.25,
                        backgroundColor: '#fff',
                        borderRadius: moderateScale(8),
                        paddingVertical: moderateScaleVertical(4),
                        paddingHorizontal: moderateScale(6),
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: colors.black,
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}>
                      <Text
                        style={{
                          fontFamily: fontFamily.circularBold,
                          fontSize: textScale(12),
                          color: colors.blackLight,
                        }}>
                        {Number(item.loyality_points).toFixed(0)}
                      </Text>
                    </View>
                  </Animated.View>
                );
              }}
              ListFooterComponent={() => (
                <View style={{paddingBottom: moderateScale(60)}} />
              )}
            />
          </ScrollView>
          <Pressable
            onPress={() => setshowpointsModal(true)}
            style={{
              flexDirection: 'row',
              height: moderateScaleVertical(62),
              alignItems: 'center',
              paddingVertical: moderateScaleVertical(10),
              paddingHorizontal: moderateScale(10),
              borderRadius: moderateScale(40),
              marginHorizontal: moderateScale(50),
              marginTop:
                Platform.OS === 'ios'
                  ? moderateScaleVertical(10)
                  : moderateScaleVertical(4),
              shadowColor: '#000',
              backgroundColor: '#edeeee',
              // backgroundColor: '#c80100',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 3,
              borderWidth: moderateScale(1.2),
              borderColor: themeColors.primary_color,
            }}>
            {/* Date */}
            <View style={{flex: 0.25, alignItems: 'flex-start'}}>
              <Text
                style={{
                  fontSize: textScale(8.4),
                  color: colors.blackOpacity30,
                  fontFamily: fontFamily.regular,
                }}>
                {!!data?.auth_user?.rank_date_time
                  ? moment(data?.auth_user?.rank_date_time).format(
                      'hh:mm:ss DD/MM/YY',
                    )
                  : strings.NONE}
              </Text>
            </View>
            <LinearGradient
              colors={
                filterData?.slug == 'today'
                  ? ['#d5a887', '#c99474', '#b16c4d']
                  : filterData?.slug == 'weekly'
                  ? ['#e2e1dd', '#c2bfba', '#918e89']
                  : ['#f6db89', '#e5b959', '#cf8e28']
              }
              style={{
                width: moderateScale(32),
                height: moderateScale(32),
                borderRadius: moderateScale(16),
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: moderateScale(10),
              }}>
              <Text
                style={{
                  fontFamily: fontFamily.circularBold,
                  color: '#fff',
                  fontSize: textScale(14),
                }}>
                {data?.auth_user?.rank}
              </Text>
            </LinearGradient>

            {/* User Name */}
            <View style={{flex: 0.5}}>
              <Text
                style={{
                  fontFamily: fontFamily.circularBold,
                  fontSize: textScale(13),
                  color: colors.black,
                  textAlign: 'left',
                }}>
                {/* {item.name} */}
                {data?.auth_user?.name}
              </Text>
            </View>

            {/* Points Card */}
            <View
              style={{
                flex: 0.25,
                backgroundColor: '#fff',
                borderRadius: moderateScale(8),
                paddingVertical: moderateScaleVertical(4),
                paddingHorizontal: moderateScale(6),
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
              <Text
                style={{
                  fontFamily: fontFamily.circularBold,
                  fontSize: textScale(12),
                  color: colors.blackLight,
                }}>
                {/* {item.loyality_points} */}
                {data?.auth_user?.loyality_points}
              </Text>
            </View>
          </Pressable>
          <View
            style={{
              flex: 0.55,
              marginTop:
                Platform.OS === 'ios'
                  ? moderateScaleVertical(36)
                  : moderateScaleVertical(10),
              top: Platform.OS === 'ios' ? 0 : moderateScaleVertical(18),
            }}>
            {!isLoading && link != null && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}>
                <View
                  style={{
                    // marginBottom: moderateScale(100),
                    marginHorizontal: moderateScale(20),
                    alignItems: 'center',
                    width: width / 5,
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      onShare();
                    }}
                    style={{
                      backgroundColor: themeColors.primary_color,
                      // padding: moderateScale(20),
                      borderRadius: moderateScale(40),
                    }}>
                    <Image
                      source={imagePath?.share_Icon}
                      style={{
                        height: moderateScale(52),
                        width: moderateScale(52),
                      }}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      paddingTop: moderateScale(10),
                      fontSize: textScale(14),
                      fontFamily: fontFamily.circularBold,
                    }}>
                    {strings.SHARE}
                  </Text>
                  <Text
                    style={{
                      paddingTop: moderateScale(4),
                      fontSize: textScale(10),
                      textAlign: 'center',
                      width: moderateScale(80),
                      fontFamily: fontFamily.regular,
                      color: colors.textColor,
                    }}>
                    {`${data?.getAdditionalPreference?.share_refer_points} ${strings.SHAREADTEXT} (${data?.refer_link_count}/${data?.getAdditionalPreference?.perday_share_count})`}
                  </Text>
                </View>
                <View
                  style={{
                    // marginBottom: moderateScale(100),
                    marginHorizontal: moderateScale(20),
                    alignItems: 'center',
                    width: width / 5,
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (data?.watch_video_count == 3) {
                        showInfo('You have watch all videos today');
                        return;
                      }
                      if (data?.advertisement != null) {
                        navigation.navigate(navigationStrings.WATCH, {
                          data: data,
                        });
                        return;
                      } else {
                        showInfo('We dont have any further videos');
                      }
                    }}
                    style={{
                      backgroundColor: themeColors.primary_color,

                      borderRadius: moderateScale(40),
                    }}>
                    <Image
                      source={imagePath?.watchIcon}
                      style={{
                        height: moderateScale(52),
                        width: moderateScale(52),
                      }}
                    />
                  </TouchableOpacity>
                  <Text
                    numberOfLines={3}
                    style={{
                      paddingTop: moderateScale(10),
                      fontSize: textScale(14),
                      fontFamily: fontFamily.circularBold,
                    }}>
                    {strings.WATCH}
                  </Text>
                  <Text
                    style={{
                      paddingTop: moderateScale(4),
                      fontSize: textScale(10),
                      textAlign: 'center',
                      width: moderateScale(80),
                      fontFamily: fontFamily.regular,
                      color: colors.textColor,
                    }}>
                    {`${data?.getAdditionalPreference?.watch_video_points} ${
                      strings.WATCHADTEXT
                    } (${
                      Number(data?.watch_video_count) > 3
                        ? 3
                        : data?.watch_video_count
                    }/3)`}
                  </Text>
                </View>
                <View
                  style={{
                    // marginBottom: moderateScale(100),
                    marginHorizontal: moderateScale(20),
                    alignItems: 'center',
                    width: width / 5,
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate(navigationStrings.TAXIHOMESCREEN);
                    }}
                    style={{
                      backgroundColor: themeColors.primary_color,

                      borderRadius: moderateScale(40),
                    }}>
                    <Image
                      source={imagePath?.IcCarNe}
                      style={{
                        height: moderateScale(52),
                        width: moderateScale(52),
                      }}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      paddingTop: moderateScale(10),
                      fontSize: textScale(14),
                      fontFamily: fontFamily.circularBold,
                    }}>
                    {strings.TRIPS}
                  </Text>
                  <Text
                    style={{
                      paddingTop: moderateScale(4),
                      fontSize: textScale(10),
                      textAlign: 'center',
                      width: moderateScale(86),
                      fontFamily: fontFamily.regular,
                      color: colors.textColor,
                    }}>
                    {`${data?.getAdditionalPreference?.ride_complete_points} ${strings.TRIPSADTEXT}`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </>
      )}
      <Modal
        isVisible={showpointsModal}
        animationIn={'zoomIn'}
        animationOut={'zoomOut'}
        onBackButtonPress={() => setshowpointsModal(false)}
        onBackdropPress={() => setshowpointsModal(false)}>
        <View
          style={{
            padding: moderateScale(16),
            backgroundColor: colors.white,
            borderRadius: 8,
          }}>
          <FlatList
            data={userPoints}
            ItemSeparatorComponent={() => (
              <View style={{height: moderateScaleVertical(14)}} />
            )}
            renderItem={({item}) => {
              return (
                <View style={{alignItems: 'center', flexDirection: 'row'}}>
                  <Image
                    source={
                      item?.type === 1
                        ? imagePath.share_Icon
                        : item?.type === 2
                        ? imagePath.IcCarNe
                        : item?.type === 3
                        ? imagePath.watchIcon
                        : imagePath.watchIcon
                    }
                    style={{
                      resizeMode: 'contain',
                      width: moderateScale(46),
                      height: moderateScale(46),
                    }}
                  />
                  <Text
                    style={{
                      fontSize: textScale(14),
                      fontFamily: fontFamily.bold,
                      marginLeft: moderateScale(10),
                    }}>
                    {`${item?.points} ${item?.name}`}
                  </Text>
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </WrapperContainer>
  );
}
