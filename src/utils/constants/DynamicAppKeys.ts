import {Platform} from 'react-native';
import {getBundleId} from 'react-native-device-info';

const shortCodes = {
  cabjak: '96c184',
};

interface AppIds {
  [key: string]: string;
}

const appIds: AppIds = {
  cabjak: Platform.select({
    ios: 'com.cabjak.OrderApp',
    android: 'com.cabjak.OrderApp',
    default: '',
  }),
};

const socialKeys = {
  TWITTER_COMSUMER_KEY: 'R66DHARfuoYAPowApUxNxwbPi',
  TWITTER_CONSUMER_SECRET: 'itcicJ7fUV3b73B8V05GEDBo4tzxGox2Si2q0BCk5pue327k15',
};

export {appIds, socialKeys, shortCodes};
