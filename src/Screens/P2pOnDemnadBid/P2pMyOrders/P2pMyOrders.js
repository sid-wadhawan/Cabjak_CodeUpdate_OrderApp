import { useFocusEffect } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDarkMode } from 'react-native-dynamic';
import * as RNLocalize from 'react-native-localize';
import { useSelector } from 'react-redux';
import Header2 from '../../../Components/Header2';
import P2pProductComp from '../../../Components/P2pProductComp';
import SwitchableTabs from '../../../Components/SwitchableTabs';
import WrapperContainer from '../../../Components/WrapperContainer';
import imagePath from '../../../constants/imagePath';
import navigationStrings from '../../../navigation/navigationStrings';
import actions from '../../../redux/actions';
import colors from '../../../styles/colors';
import {
    moderateScale,
    moderateScaleVertical,
    textScale
} from '../../../styles/responsiveSize';
import { MyDarkTheme } from '../../../styles/theme';
import { showError } from '../../../utils/helperFunctions';
import stylesFunc from './styles';
import strings from '../../../constants/lang';

export default function P2pMyOrders({ navigation }) {
    const { appData, currencies, languages, appStyle, themeColors, themeToggle, themeColor } = useSelector(
        state => state?.initBoot,
    );

    const { userData } = useSelector((state) => state?.auth);
    const { location } = useSelector(state => state?.home);
    const darkthemeusingDevice = useDarkMode();
    const isDarkMode = themeToggle ? darkthemeusingDevice : themeColor;

    const { preferences } = appData?.profile;
    const fontFamily = appStyle?.fontSizeData;
    const styles = stylesFunc({ fontFamily, themeColors })

    const [tabsData, setTabsData] = useState([
        {
            id: 1,
            title: strings.ALL,
        },
        {
            id: 2,
            title: strings.UPCOMING_RENTS,
        },
        {
            id: 3,
            title: strings.ONGOING_RENTS,
        },
    ]);
    const [selectedTab, setSelectedTab] = useState({
        id: 1,
        title: 'All',
    });
    const [orderHistory, setOrderHistory] = useState([]);
    const [isRefreshing, setisRefreshing] = useState(false);
    const [pageNo, setpageNo] = useState(1);
    const [isLoadMore, setisLoadMore] = useState(true);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [upcomingOngoingOrders, setUpcomingOngoingOrders] = useState([]);

    useFocusEffect(
        useCallback(() => {
            if (!userData?.auth_token) {
                actions.setAppSessionData('on_login');
                return;
            }
            if (selectedTab?.id == 1) {
                getOrders();
                setIsLoadingOrders(true);
            }
            else {
                getOngoingAndUpcomingOrders(selectedTab);
                setIsLoadingOrders(true);
            }
        }, []),
    );

    const onChangeTab = type => {
        setSelectedTab(type);
        setpageNo(1);
        if (type?.id == 1) {
            getOrders(1, 'all');
        } else {
            getOngoingAndUpcomingOrders(type);
        }
    };

    const handleRefresh = () => {
        setisRefreshing(true);
        setpageNo(1);
        setisLoadMore(true);
        if (selectedTab?.id == 1) {
            getOrders(1, 'all');
        } else {
            getOngoingAndUpcomingOrders(selectedTab);
        }
    };
    const onEndReached = () => {
        if (isLoadMore) {
            setpageNo(pageNo + 1);
            getOrders(pageNo + 1);
        }
    };

    const getOngoingAndUpcomingOrders = type => {
        actions
            .getUpcomingAndOngoingOrders(
                `?type=${type?.id == 2 ? 'upcoming' : 'ongoing'}`,
                {},
                {
                    code: appData?.profile?.code,
                    currency: currencies?.primary_currency?.id,
                    language: languages?.primary_language?.id,
                },
            )
            .then(res => {
                console.log(res, '<===res getUpcomingAndOngoingOrders');
                setIsLoadingOrders(false)
                setUpcomingOngoingOrders(res?.data);

            })
            .catch(errorMethod);
    };

    const getOrders = (pageNo = 1, type = 'all') => {

        actions
            .getAllP2pOrders(
                `?limit=${12}&page=${pageNo}&type=${type}`,
                {},
                {
                    code: appData?.profile?.code,
                    currency: currencies?.primary_currency?.id,
                    language: languages?.primary_language?.id,
                    timezone: RNLocalize.getTimeZone(),
                    latitude: location?.latitude.toString() || '',
                    longitude: location?.longitude.toString() || '',
                },
            )
            .then(res => {
                console.log(res, '<===res getAllP2pOrders');
                setIsLoadingOrders(false);
                setOrderHistory(
                    pageNo === 1
                        ? res?.data?.data
                        : [...orderHistory, ...res?.data?.data],
                );
                setisRefreshing(false);
                if (res?.data?.current_page === res?.data?.last_page) {
                    setisLoadMore(false);
                }
            })
            .catch(errorMethod);
    };

    const errorMethod = (error) => {
        setisRefreshing(false);
        setIsLoadingOrders(false);
        showError(error?.message || error?.error);
    }

    const renderOrders = useCallback(
        ({ item }) =>  {

            return    <P2pProductComp item={item} onViewDetails={() => navigation?.navigate(navigationStrings.P2P_ORDER_DETAIL, {
                order_id: item?.order_id
            })} />;
        },
        [orderHistory, selectedTab],
    );

    const renderUpcomingOngoingOrders = useCallback(
        ({ item }) => {
            return <P2pProductComp item={item} onViewDetails={() => navigation?.navigate(navigationStrings.P2P_ORDER_DETAIL, {
                order_id: item?.order_id
            })} />;
        },
        [upcomingOngoingOrders],
    );

    const ListEmptyComp = () => <View
        style={styles.emptyContainer}>
        <Image
            source={imagePath.noDataFound3}
            style={{
                height: moderateScale(300),
                width: moderateScale(300),
            }}
        />
    </View>

    const ItemSeparatorComponent = () => <View
        style={{
            height: moderateScaleVertical(12),
        }}
    />

    const HeaderView = ({ leftText = "", onPressRight = () => { } }) => <View
        style={styles.headerContainer}>
        <Text
            style={{ ...styles.leftText, color: isDarkMode ? MyDarkTheme.colors.text : colors.black }}>
            {leftText}
        </Text>
        <TouchableOpacity onPress={onPressRight}>
            <Text
                style={styles.rightTxt}>
                View all
            </Text>
        </TouchableOpacity>
    </View>



    return (
        <WrapperContainer isLoading={isLoadingOrders} bgColor={isDarkMode ? MyDarkTheme.colors.background : colors.white} >
            <Header2
                centerTitle={strings.ORDERS}
                textStyle={{
                    fontFamily: fontFamily?.medium,
                    fontSize: textScale(16),
                }}
            />
            <View
                style={{
                    height: 1,
                    backgroundColor: colors.textGreyO,
                }}
            />
            <SwitchableTabs
                tabsData={tabsData}
                selectedTab={selectedTab}
                onChangeTab={onChangeTab}
                mainContainerStyle={{
                    marginHorizontal: moderateScale(10),
                    marginTop: moderateScaleVertical(20),
                }}
            />

            <View
                style={{
                    flex: 1,
                    marginTop:moderateScale(10)
                }}>
                {selectedTab?.id == 1 ? (
                    <FlatList
                        data={orderHistory}
                        renderItem={renderOrders}
                        onEndReached={onEndReached}
                        onEndReachedThreshold={0.5}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                tintColor={themeColors.primary_color}
                            />
                        }
                        ItemSeparatorComponent={ItemSeparatorComponent}
                        ListEmptyComponent={ListEmptyComp}
                    />
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {!isEmpty(upcomingOngoingOrders?.lender) ||
                            !isEmpty(upcomingOngoingOrders?.borrower) ? (
                            <View>
                                {!isEmpty(upcomingOngoingOrders?.lender) && (
                                    <View style={{
                                        marginTop: moderateScaleVertical(16)
                                    }}>
                                        <HeaderView leftText={"As Lender"} onPressRight={() => navigation.navigate(navigationStrings.RENT_TYPE_LISTING, {
                                            userType: "lender",
                                            type: selectedTab?.id == 2 ? "upcoming" : "ongoing"
                                        })} />
                                        <FlatList
                                            data={upcomingOngoingOrders?.lender}
                                            renderItem={renderUpcomingOngoingOrders}
                                            scrollEnabled={false}
                                            refreshControl={
                                                <RefreshControl
                                                    refreshing={isRefreshing}
                                                    onRefresh={handleRefresh}
                                                    tintColor={themeColors.primary_color}
                                                />
                                            }
                                            ItemSeparatorComponent={ItemSeparatorComponent}

                                        />
                                    </View>
                                )}

                                {!isEmpty(upcomingOngoingOrders?.borrower) && (
                                    <View style={{
                                        marginTop: moderateScaleVertical(16)
                                    }}>
                                        <HeaderView leftText={"As Borrower"} onPressRight={() => navigation.navigate(navigationStrings.RENT_TYPE_LISTING, {
                                            userType: "borrower",
                                            type: selectedTab?.id == 2 ? "upcoming" : "ongoing"
                                        })} />
                                        <FlatList
                                            scrollEnabled={false}
                                            data={upcomingOngoingOrders?.borrower}
                                            renderItem={renderUpcomingOngoingOrders}
                                            refreshControl={
                                                <RefreshControl
                                                    refreshing={isRefreshing}
                                                    onRefresh={handleRefresh}
                                                    tintColor={themeColors.primary_color}
                                                />
                                            }
                                            ItemSeparatorComponent={ItemSeparatorComponent}

                                        />
                                    </View>
                                )}
                            </View>
                        ) : <ListEmptyComp />}
                        <View style={{
                            height: moderateScaleVertical(100)
                        }} />
                    </ScrollView>
                )}
            </View>
        </WrapperContainer>
    );
}
