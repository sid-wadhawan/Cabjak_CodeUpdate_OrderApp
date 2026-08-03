import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  height,
  moderateScale,
  moderateScaleVertical,
  width,
} from '../../styles/responsiveSize';
import HomeLoader from './HomeLoader';

const CategoryLoader2 = ({
  viewStyles = {},
  widthTop = moderateScale(62),
  heightTop = moderateScale(60),
  rectWidthTop = moderateScale(62),
  rectHeightTop = moderateScale(60),
  rectWidthBottom = moderateScaleVertical(12),
  isFourthItem = true,
  isSubCategory = false,
  radius = moderateScale(8),
}) => {
  const _categoryView = () => {
    return (
      <View>
        <HomeLoader
          width={widthTop}
          height={heightTop}
          rectWidth={rectWidthTop}
          rectHeight={rectHeightTop}
          rx={radius}
          ry={radius}
        />
        <View style={{height: moderateScaleVertical(7)}} />
        <HomeLoader
          width={widthTop}
          height={rectWidthBottom}
          rectWidth={widthTop}
          rectHeight={rectWidthBottom}
          viewStyles={{marginTop: 5}}
        />
      </View>
    );
  };
  return (
    <View
      style={{
        marginHorizontal: moderateScale(22),
        ...viewStyles,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
      {_categoryView()}
      {_categoryView()}
      {_categoryView()}
      {isFourthItem && <>{_categoryView()}</>}
    </View>
  );
};

const styles = StyleSheet.create({});
export default React.memo(CategoryLoader2);
