import React from 'react';
import {
  Image,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../styles/responsiveSize';
import colors from '../../styles/colors';
import imagePath from '../../constants/imagePath';

export default function CardViewNotification({data = {}, containerStyle, onPress}) {
  const {appStyle} = useSelector(state => state?.initBoot);
  const fontFamily = appStyle?.fontSizeData;
  const isUnread = !data?.isRead;

  return (
    <View
      style={[styles.card, containerStyle]}>

      {/* Left Icon */}
      {/* <LinearGradient
        colors={['#c93247', '#FF3D00']}
        style={styles.iconWrapper}> */}
        <View style={styles.iconWrapper}>
        <Image
          source={imagePath.notifBell}
          style={styles.icon}
          resizeMode="contain"
        />
        </View>
      {/* </LinearGradient> */}

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {fontFamily: fontFamily.medium},
          ]}>
          {data?.title || 'Notification'}
        </Text>

        {/* Message (Main Highlight) */}
        <Text
          numberOfLines={2}
          style={[
            styles.message,
            {fontFamily: fontFamily.medium, marginBottom:moderateScaleVertical(6)},
          ]}>
          {data?.message || 'This is a sample notification message.'}
        </Text>

        {/* Footer Row */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.date,
              {fontFamily: fontFamily.regular},
            ]}>
            {moment(data?.created_at).format('DD MMM YYYY')}
          </Text>

          <View style={styles.timeChip}>
            <Text
              style={[
                styles.timeText,
                {fontFamily: fontFamily.medium},
              ]}>
              {moment(data?.created_at).format('hh:mm A')}
            </Text>
          </View>
        </View>
      </View>

      {/* Unread Dot with Glow */}
      {/* {isUnread && <View style={styles.unreadDot} />} */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginHorizontal: moderateScale(14),
    marginVertical: moderateScaleVertical(6),
    backgroundColor: colors.white,
    shadowColor: colors.textGreyH,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
    alignItems: 'flex-start',
    // borderBottomWidth:moderateScale(1.2),
    borderColor:colors.greyColor2
  },
  iconWrapper: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
    // shadowColor: '#FF6A00',
    // shadowOpacity: 0.6,
    // shadowRadius: 12,
    // elevation: 6,
  },
  icon: {
   width: moderateScale(40),
    height: moderateScale(40),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: textScale(11.6),
    color: '#777',
    marginBottom: 4,
  },
  message: {
    fontSize: textScale(13),
    color: '#111',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: textScale(11),
    color: '#999',
  },
  timeChip: {
    backgroundColor: '#F4F4F4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  timeText: {
    fontSize: textScale(11),
    color: '#444',
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    marginLeft: 8,
    marginTop: 6,
    shadowColor: '#4A90E2',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
});
