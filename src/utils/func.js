import _ from 'lodash';
import * as countriesList from '../data/countries.json';

export const locationToUrl = (location) => {
    return location.toLowerCase().replace(/ /g, '-').replace("'", '-');
}

export const urlToLocation = (url) => {

    if(url == 'cote-d-ivoire') {
        url = "cote-d'ivoire";
    }

    let location = _.find(countriesList, (country) => country.location.toLowerCase() === url.replace('-',' ') );

    if(url == 'guinea-bissau') {
        location = _.find(countriesList, (country) => country.location.toLowerCase() === url );
    }

    return location;
}
