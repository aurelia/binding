import {signalBindings} from 'aurelia-binding';

export class App {

  locales = [
    { locale: 'en-US', name: 'US' },
    { locale: 'en-GB', name: 'UK' },
    { locale: 'ko-KR', name: 'Korean' },
    { locale: 'ar-EG', name: 'Arabic' },
    { locale: 'ja-JP-u-ca-japanese', name: 'Japan' },
    { locale: 'de-DE', name: 'Germany' },
    { locale: 'pt-BR', name: 'Brazil' },
    { locale: 'ru-RU', name: 'Russia' },
    { locale: 'es-ES', name: 'Spain' },
    { locale: 'it-IT', name: 'Italy' },
    { locale: 'zh-CN', name: 'China' },
    { locale: 'zh-HK', name: 'Hong Kong' },
    { locale: 'zh-TW', name: 'Taiwan' }
  ];

  changeLocale(locale) {
    window.currentLocale = locale;
    signalBindings('locale-changed');
  }

  constructor() {
    this.flights = [
      { from: 'Los Angeles', to: 'San Fran', depart: new Date('2017-10-09'), arrive: new Date('2017-10-10') },
      { from: 'Melbourne', to: 'Sydney', depart: new Date('2017-10-11'), arrive: new Date('2017-10-12') },
      { from: 'Hawaii', to: 'Crescent', depart: new Date('2017-10-13'), arrive: new Date('2017-10-14') }
    ];
  }
}
