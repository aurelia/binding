import moment from 'moment';

export class DateFormatValueConverter {
  toView(value) {
    return moment(value).format('M/D/YYYY h:mm:ss a');
  }
}
