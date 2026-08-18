import _ from 'lodash';
import * as countriesList from '../data/countries.json';

const countries = Array.isArray(countriesList) ? countriesList : (countriesList.default || []);

export const getCountries = () => countries;

export const locationToUrl = (location) => {
    return location.toLowerCase().replace(/ /g, '-').replace("'", '-');
}

export const urlToLocation = (url) => {
    if (!url) {
        return undefined;
    }

    if(url == 'cote-d-ivoire') {
        url = "cote-d'ivoire";
    }

    let location = _.find(countries, (country) => country.location.toLowerCase() === url.replaceAll('-',' ') );

    if(url == 'guinea-bissau') {
        location = _.find(countries, (country) => country.location.toLowerCase() === url );
    }

    return location;
}

export const getCountryFromSearch = (search = document.location.search) => {
    const slug = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('country');
    return urlToLocation(slug);
}

export const navigateToCountry = (country) => {
    const url = '?country=' + locationToUrl(country.location);
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('adh-country-change'));
}
