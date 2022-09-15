import React from 'react';

import getCountryISO2 from 'country-iso-3-to-2';
import ReactCountryFlag from 'react-country-flag';

import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

import * as countriesList from '../data/countries.json';

import { locationToUrl, urlToLocation, locationToISO } from '../utils/func.js';

export class CountrySelect extends React.Component {

    isCountryPage = () => {
        return window.location.pathname == null || window.location.pathname == '/' ? 'Select a Country' : <>
            <div style={{width: '1.5em', height: '1.5em', borderRadius: '50%', overflow: 'hidden', position: 'relative', display: 'inline-block', top: '0.2em', marginRight: '0.4em'}} className="border">
                <ReactCountryFlag
                svg
                countryCode={getCountryISO2(urlToLocation(window.location.pathname.split('/')[1]).iso_code)}
                style={{
                    position: 'absolute', 
                    top: '30%',
                    left: '30%',
                    marginTop: '-50%',
                    marginLeft: '-50%',
                    fontSize: '2em',
                    lineHeight: '2em',
                }}/>
            </div>
            <div className="text-black d-inline-block ms-1" style={{position: 'relative', top: '-3px'}}>{urlToLocation(window.location.pathname.split('/')[1]).location}</div>
        </>
            
    }

    render() {
        return (
        <DropdownButton size="lg" title={this.isCountryPage()} className="country-select">
            {countriesList.map((country,index) => (
                <Dropdown.Item key={country.iso_code} onClick={ () => { window.location.href = '/' + locationToUrl(country.location); } }>
                    <div style={{width: '1.5em', height: '1.5em', borderRadius: '50%', overflow: 'hidden', position: 'relative', display: 'inline-block'}} className="border">
                        <ReactCountryFlag
                        svg
                        countryCode={getCountryISO2(country.iso_code)}
                        style={{
                            position: 'absolute', 
                            top: '30%',
                            left: '30%',
                            marginTop: '-50%',
                            marginLeft: '-50%',
                            fontSize: '2em',
                            lineHeight: '2em',
                        }}/>
                    </div>
                    <div className="text-black d-inline-block ms-1" style={{position: 'relative', top: '-5px'}}>{country.location}</div>
                </Dropdown.Item>
            ))}
        </DropdownButton>)
    }

}