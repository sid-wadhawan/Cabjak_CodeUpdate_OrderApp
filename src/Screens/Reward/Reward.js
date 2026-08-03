import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import WrapperContainer from '../../Components/WrapperContainer';
import Header2 from '../../Components/Header2';
import Header from '../../Components/Header';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  textScale,
  width,
} from '../../styles/responsiveSize';
import colors from '../../styles/colors';
import fontFamily from '../../styles/fontFamily';
import imagePath from '../../constants/imagePath';
import FastImage from 'react-native-fast-image';
import {useSelector} from 'react-redux';
import actions from '../../redux/actions';
import {debounce} from 'lodash';
import NoDataFound from '../../Components/NoDataFound';

const Reward = () => {
  const {
    themeColors,
    appStyle,
    appData,
    shortCodeStatus,
    languages,
    currencies,
  } = useSelector(state => state?.initBoot);
  const [user, setUser] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [filterData, setFilterData] = useState({
    id: 0,
    value: 'Daily',
    slug: 'today',
  });
  const [filter, setFiilter] = useState([
    {id: 0, value: 'Daily Rewards', slug: 'today'},
    {id: 1, value: 'Weekly Rewards', slug: 'weekly'},
    {id: 2, value: 'Monthly Rewards', slug: 'monthly'},
  ]);
  console.log(user, 'useruser');
  useEffect(() => {
    let headers = {
      code: appData?.profile?.code,
      currency: currencies?.primary_currency?.id,
      language: languages?.primary_language?.id,
    };
    actions
      // .leaderBoarrd(`?day_type=${filterData?.slug}`, {}, headers)
      .getRewards(`?type=${filterData?.id}`, {}, headers)
      .then(res => {
        console.log(res, 'resersersre');
        setUser(res?.data);
      })
      .catch(err => {
        console.log(err, 'gjkrejy');
        setIsLoading(false);
      });
  }, [filterData]);

  const onEndReached = ({distanceFromEnd}) => {
    console.log('kkokokokoko');
    setPageNo(pageNo + 1);
  };

  const onEndReachedDelayed = debounce(onEndReached, 1000, {
    leading: true,
  });

  return (
    <WrapperContainer>
      <Header centerTitle={'Reward'} />
      <View
        style={{
          flexDirection: 'row',
          marginTop: moderateScale(20),
          marginHorizontal: moderateScale(16),
          alignItems: 'center',
          // backgroundColor:'red'
          // borderWidth: 0.5,
          // borderRadius: moderateScale(10),
        }}>
        {filter.map((item, inx) => {
          return (
            <>
              <TouchableOpacity
                style={{
                  // padding:
                  //   // filterData?.slug == item?.slug
                  //   // ? moderateScale(10)
                  //   // :
                  //   moderateScale(10),
                  marginRight: moderateScale(10),
                  backgroundColor:
                    filterData?.slug == item?.slug
                      ? colors.black
                      : colors.blackOpacity05,
                  height: moderateScaleVertical(40),
                  width:
                    filterData?.slug == item?.slug ? width / 2.5 : width / 4.2,
                  // backgroundColor:
                  //   filterData?.slug == item?.slug ? '#DDDD' : null,
                  // backgroundColor: 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // borderWidth: 0.5,
                  // borderColor: themeColors?.primary_color,
                  borderRadius:
                    filterData?.slug == item?.slug
                      ? moderateScale(13)
                      : moderateScale(13),
                }}
                onPress={() => {
                  setFilterData(item);
                }}>
                <Text
                  style={{
                    fontSize:
                      filterData?.slug == item?.slug
                        ? textScale(14)
                        : textScale(11),
                    fontFamily: fontFamily?.medium,
                    color:
                      filterData?.slug == item?.slug
                        ? colors.white
                        : colors.black,
                  }}>
                  {item?.value}
                </Text>
              </TouchableOpacity>
            </>
          );
        })}
      </View>
      <ScrollView style={{flex: 1}}>
        <FlatList
          data={user?.data}
          ListHeaderComponent={() => (
            <View style={{marginTop: moderateScale(20)}} />
          )}
          // ListFooterComponent={() => (
          //   <View style={{marginTop: moderateScale(20)}} />
          // )}
          ListEmptyComponent={() => {
            return (
              <View style={{height: height / 2}}>
                <NoDataFound />
              </View>
            );
          }}
          renderItem={({item, index}) => {
            console.log(item, 'item');
            return (
              <View
                style={{
                  backgroundColor: colors?.white,
                  // elevation: 6,
                  padding: moderateScale(10),

                  // shadowColor: '#000',
                  // shadowOffset: {
                  //   width: 0,
                  //   height: 2,
                  // },
                  // shadowOpacity: 0.25,
                  // shadowRadius: 3.84,
                  flexDirection: 'row',
                  // justifyContent: 'space-between',
                  // marginBottom: moderateScale(2),
                  alignItems: 'center',
                  borderRadius: moderateScale(10),
                  alignItems: 'center',
                }}>
                <View style={{flex: 0.08, alignItems: 'center'}}>
                  {index >= 3 ? (
                    <Text
                      style={{
                        fontFamily: fontFamily.bold,
                        fontSize: textScale(14),
                      }}>
                      {index + 1}
                    </Text>
                  ) : index === 0 ? (
                    <Image
                      style={{
                        height: moderateScaleVertical(38),
                        width: moderateScale(30),
                      }}
                      source={imagePath.firstFrame}
                    />
                  ) : index === 1 ? (
                    <Image
                      style={{
                        height: moderateScaleVertical(38),
                        width: moderateScale(30),
                      }}
                      source={imagePath.secondFrame}
                    />
                  ) : index === 2 ? (
                    <Image
                      style={{
                        height: moderateScaleVertical(38),
                        width: moderateScale(30),
                      }}
                      source={imagePath.thirdFrame}
                    />
                  ) : null}
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: index > 2 ? '#E9E9E9' : '#FFEEEE',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderRadius: moderateScale(10),
                    padding: moderateScale(10),
                    marginLeft: moderateScale(14),
                    alignItems: 'center',
                  }}>
                  <FastImage
                    style={{
                      height: 38,
                      width: 38,
                      backgroundColor: colors.textColor,
                      borderRadius: moderateScale(20),
                    }}
                    source={{uri: item?.image}}
                  />
                  <Text
                    style={{
                      fontFamily: fontFamily?.bold,
                      textTransform: 'capitalize',
                    }}>
                    Win
                  </Text>
                  <View style={{}}>
                    <Text
                      style={{
                        fontFamily: fontFamily?.bold,
                        textTransform: 'capitalize',
                      }}>
                      {item?.name}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponentStyle={() => {
            return (
              <View style={{marginBottom: moderateScaleVertical(18)}}></View>
            );
          }}
          onEndReached={onEndReachedDelayed}
          onEndReachedThreshold={0.5}
        />
      </ScrollView>
    </WrapperContainer>
  );
};

export default Reward;

const styles = StyleSheet.create({});
