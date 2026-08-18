import React from 'react';

import _ from 'lodash';
import moment from 'moment';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

import { ResponsiveContainer, ComposedChart, Bar, Brush, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label } from 'recharts';
import { saveAs } from 'file-saver';

import { CountrySelect } from '../components/CountrySelect';

import getCountryISO2 from 'country-iso-3-to-2';
import ReactCountryFlag from 'react-country-flag';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFileDownload } from '@fortawesome/free-solid-svg-icons';

import * as settings from '../data/settings.json';
import { locationToUrl, urlToLocation } from '../utils/func.js';
import { Collapse } from 'react-bootstrap';
import SocialMedia from '../components/SocialMedia';

import adhLogo from '../adh-logo.png'


import * as annualRates from '../data/annual-rates.json';
import * as inflation from '../data/inflation.json';

// The bundled dataset is columnar — one array of monthly values per indicator,
// all sharing inflation.dates — which keeps it small. The chart wants one
// object per month, so expand a country's grid on the way into state.
const buildRecords = (indicatorSeries) => inflation.dates.map((date, monthIndex) => {
    let record = { date };

    inflation.indicators.forEach((indicatorCode, indicatorIndex) => {
        record[indicatorCode] = indicatorSeries[indicatorIndex][monthIndex];
    });

    return record;
});

// Four countries carry an annual-rates row with no usable figure in it, and two
// are in the picker with no row at all. Return nothing rather than 'NaN%'.
const headlineRate = (rates) => {
    if (rates == undefined || !rates.last_full_year) return undefined;

    let value = parseFloat(rates[rates.last_full_year]);

    return isNaN(value) ? undefined : { year: rates.last_full_year, value: Math.round(value * 100) / 100 };
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <strong>{`${moment(label).format('MMM YY')}`}</strong>
                { payload.map((metric, index) => 
                    <div key={index} style={{color: metric.color}}>{`${metric.value}`}%</div>
                ) }
            </div>
        );
    }
  
    return null;
};

export class Country extends React.Component {

    constructor() {
        super();
        this.state = {
            selectedCountry: undefined,
            selectedCountryIso2: undefined,
            selectedMetric: settings.countryChart.selectedBaseMetric,
            data: undefined,
            loading: true,
        }
    }

    componentDidMount() {
        let self = this;

        let searchTerms = document.location.search.split('&');
        let countrySearch = searchTerms.filter(term => term.includes('country='))[0];
        let country = urlToLocation(countrySearch.split('=')[1]);

        if (country == undefined) {
            this.setState({ loading: false });
            return;
        }

        country.annual_rates = annualRates.find(cntry => cntry.country_code == country.iso_code);
        country.url = locationToUrl(country.location);

        // Eritrea and Saint Helena are in the picker but have no series.
        let indicatorSeries = inflation.countries[country.iso_code];

        this.setState({
            selectedCountry: country,
            selectedCountryIso2: getCountryISO2(country.iso_code),
            selectedMetric: settings.countryChart.selectedBaseMetric,
            data: indicatorSeries == undefined ? undefined : buildRecords(indicatorSeries),
            loading: false
        }, () => {
            self.addMetadata();
        });
    }


    addMetadata = () => {

        let page_title = document.querySelector('h1.hero-title');

        if(page_title != null) {

            page_title.innerHTML = `${this.state.selectedCountry.location} Inflation Observer`;
            document.title = `${this.state.selectedCountry.location} Inflation Observer | Africa Data Hub`;

            document.querySelector('meta[name="description"]').setAttribute("content", `Consumer price inflation in ${this.state.selectedCountry.location}, 2008 to the present, including COICOP indicators`);

            document.querySelector('meta[property="og:title"]').setAttribute("content", `${this.state.selectedCountry.location} Inflation Observer | Africa Data Hub`);

            document.querySelector('meta[property="og:description"]').setAttribute("content", `Consumer price inflation in ${this.state.selectedCountry.location}, 2008 to the present, including COICOP indicators`);

            document.querySelector('meta[property="twitter:title"]').setAttribute("content", `${this.state.selectedCountry.location} Inflation Observer | Africa Data Hub`);

            document.querySelector('meta[property="twitter:description"]').setAttribute("content", `Consumer price inflation in ${this.state.selectedCountry.location}, 2008 to the present, including COICOP indicators`);

            document.querySelector('meta[property="og:type"]').setAttribute("content", `website`);

            // document.getElementById("countrySelect").value = this.state.selectedCountry.location;

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.innerHTML = `{
            "@context":"https://schema.org/",
            "@type":"Dataset",
            "name":"${this.state.selectedCountry.location} Consumer price inflation, 2008-present",
            "description":"Consumer price inflation in ${this.state.selectedCountry.location}, 2008 to the present, including COICOP indicators",
            "url":"https://www.africadatahub.org/data-resources/inflation-observer?country=${this.state.selectedCountry.url}",
            "isPartOF":"https://www.africadatahub.org/data-resources/inflation-observer",
            "keywords":[
                "CONSUMER PRICE INFLATION > MONTHLY CHANGE, ANNUAL %", 
                "CONSUMER PRICE INFLATION > COICOP INDICATORS",
                "CONSUMER PRICE INFLATION > AFRICA > {COUNTRY}"
            ],
            "isAccessibleForFree" : true,
            "creator":{
                "@type":"Organization",
                "url": "https://www.africadatahub.org",
                "name":"Africa Data Hub",
                "contactPoint":{
                    "@type":"ContactPoint",
                    "contactType": "enquiries",
                    "email":"info@africadatahub.org"
                }
            },
            "funder":{
                "@type": "Organization",
                "sameAs": "https://www.gatesfoundation.org/",
                "name": "Bill & Melinda Gates Foundation"
            },
            "includedInDataCatalog":{
                "@type":"DataCatalog",
                "name":"https://ckan.africadatahub.org/"
            },
            "distribution":[
                {
                    "@type":"DataDownload",
                    "encodingFormat":"CSV",
                    "contentUrl":"https://raw.githubusercontent.com/africadatahub/inflation-observer/master/src/data/source/combined_imf_database.csv"
                }
            ]
        }`;

        const font_script = document.createElement('script');
        font_script.type = 'text/javascript';
        font_script.src = "https://kit.fontawesome.com/704ff50790.js"
        font_script.crossOrigin = "anonymous"

        document.head.appendChild(script);
        document.head.appendChild(font_script);
    
    }
    
    }


   

    selectMetric = (e) => {
        this.setState({selectedMetric: e.target.value})
    }

    downloadChart = () => {

        let self = this;

        let chartSVG = document.querySelector('svg.recharts-surface');
        const width = chartSVG.clientWidth;
        const height = chartSVG.clientHeight;
        let svgURL = new XMLSerializer().serializeToString(chartSVG);
        let svgBlob = new Blob([svgURL], { type: "image/svg+xml;charset=utf-8" });
        let URL = window.URL || window.webkitURL || window;
        let blobURL = URL.createObjectURL(svgBlob);

        

        let image = new Image();
        image.crossOrigin = "anonymous"; 
        image.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.width = width+130;
            canvas.height = height+130;
            let context = canvas.getContext('2d');
            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillRect(0,0,canvas.width,canvas.height);
            context.fillStyle = '#094151';

            //Draw Title and Logo

            //Title
            var selectedIndicator = _.find(settings.indicators, indicator => { return indicator.indicator_code == self.state.selectedMetric}).indicator_name
            var text = `Consumer price inflation rates in ${this.state.selectedCountry != undefined ? this.state.selectedCountry.location : ''}` + ` : ${selectedIndicator}`
            context.font = '600 25px Work Sans';
            context.fillText(text, 30, 40);

            //Logo
            var logo = document.getElementById('logo')
            
            context.drawImage(logo, context.canvas.width-logo.width-30, 10);


            context.drawImage(image, 20, 100, context.canvas.width-30, context.canvas.height-130);
            let jpeg = canvas.toDataURL('image/png', 1.0);
            saveAs(jpeg, self.state.selectedCountry.location.replace(' ', '-') + '--' + _.find(settings.indicators, indicator => { return indicator.indicator_code == self.state.selectedMetric}).indicator_name);
        };

        image.src = blobURL;

    }

    downloadData = () => {
        let csv = 'date,' + _.find(settings.indicators, indicator => { return indicator.indicator_code == this.state.selectedMetric }).indicator_name.replace(' ','-').replace(',','-') + ' \r';
        this.state.data.forEach(record => {
            csv += moment(record.date).format('MM-YYYY') + ',' + record[this.state.selectedMetric] + ' \r';
        });
        saveAs(new Blob([csv], {type: "text/csv;charset=utf-8"}), this.state.selectedCountry.location.replace(' ', '-') + '--' + _.find(settings.indicators, indicator => { return indicator.indicator_code == this.state.selectedMetric}).indicator_name + '.csv');
    }    

    render() {
        let self = this;

        let country = this.state.selectedCountry;
        let headline = country != undefined ? headlineRate(country.annual_rates) : undefined;
        let extraNotes = country != undefined && country.annual_rates != undefined ? country.annual_rates.Extra_notes : '';

        return (
            <div>
                <Container className="py-4">  
                    <Card className='border-0 rounded'>
                        <Card.Body>
                            <Row className="gx-2 row-eq-height">
                                <Col xs="auto" className="align-self-center">
                                    <span className="fs-5">Select countries to visualise</span>
                                </Col>
                                <Col>
                                    <CountrySelect />
                                </Col>
                                <Col xs="auto" className="align-self-center">
                                    <span className="fs-5">Select an inflation indicator</span>
                                </Col>
                                <Col>
                                    <Form.Select className="border-0 me-1" style={{backgroundColor: '#F6F6F6', height: '100%'}} onChange={this.selectMetric}>
                                        { settings.indicators.map((indicator, index) => 
                                            <option key={indicator.indicator_code} value={indicator.indicator_code}>{indicator.indicator_name}</option>
                                        ) }
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 rounded mt-4 py-4">
                        <Card.Body>
                            <Row>
                                <Col className="text-center">
                                    <h3 className="mb-0 text-primary">Consumer price inflation rates in <mark>{this.state.selectedCountry != undefined ? this.state.selectedCountry.location : ''}</mark>:</h3>
                                    {self.state.selectedMetric != '' &&
                                        <h4 className="mb-0 align-middle">{
                                        _.find(settings.indicators, indicator => { return indicator.indicator_code == self.state.selectedMetric}).indicator_name
                                        }</h4>
                                    }
                                    
                                    { headline != undefined &&
                                        <p className="mt-3 fs-5 text-black-60"><strong>{country.location}</strong>'s consumer price inflation (CPI) rate for the full year <strong>{headline.year}</strong> was <strong>{headline.value}%</strong>.</p>
                                    }
                                    { extraNotes != undefined && extraNotes != '' &&
                                        <p className="mt-3 fs-5 text-black-60">{extraNotes}</p>
                                    }
                                    <p className="fs-5 mt-3 text-black-50">Numbers are percentage change, year on year</p>
                                </Col>
                            </Row>
                            
                            <hr/>
                            
                            <div style={{minHeight: '100px'}} className="position-relative">
                                {this.state.loading && (
                                    <div className="position-absolute top-50 start-50 translate-middle text-center">
                                        <Spinner animation="grow" />
                                        <h3 className="mt-4">Loading</h3>
                                    </div>)
                                }
                                <>
                                    {this.state.data != undefined && (
                                        <ResponsiveContainer width="100%" height={400}>
                                            <ComposedChart data={this.state.data} margin={{top: 20, right: 0, bottom: 0, left: 0}}>
                                                <XAxis dataKey="date" tickFormatter={ tick => moment(tick).format('MMM \'YY') }/>

                                                <YAxis yAxisId="left" orientation="left" name='Test' stroke="#99b3bb" domain={[_.minBy(this.state.data.map(day => day[this.state.selectedMetric] == 'NaN' ? null : parseFloat(day[this.state.selectedMetric]))),_.maxBy(this.state.data.map(day => day[this.state.selectedMetric] == 'NaN' ? null : parseFloat(day[this.state.selectedMetric])))]}
                                                label={{ value: _.find(settings.indicators, indicator => { return indicator.indicator_code == self.state.selectedMetric}).indicator_name + " in %", angle: 270, position: 'insideBottomLeft', offset:10 }}
                                                padding={{ left: 30 }} 
                                                />

                                                
                                                <ReferenceLine y={0} yAxisId="left" stroke="red" label="0%" strokeDasharray="3 3" />
                                                
                                                <CartesianGrid strokeDasharray="3 3"/>

                                                <Tooltip content={<CustomTooltip/>} />
                                                
                                                {this.state.selectedMetric != '' && (<Line type="monotone" yAxisId="left" dot={false} dataKey={this.state.selectedMetric} strokeWidth={3} stroke="#089fd1" />)}

                                                <Brush dataKey="date" height={30} stroke="#8eb4bf"  tickFormatter={ tick => moment(tick).format('MM/YY') }/>
                                            </ComposedChart>
                                        </ResponsiveContainer>)
                                    }
                                    {!this.state.loading && this.state.data == undefined && (
                                        <div className="text-center py-5">
                                            <h4 className="text-black-50">No inflation data for {country != undefined ? country.location : 'this country'}</h4>
                                            <p className="text-black-50 mb-0">This country is not yet covered by the IMF and Africa Data Hub inflation database. Try another country from the dropdown above.</p>
                                        </div>)
                                    }
                                </>
                            </div>
                            <img id='logo' src={adhLogo} className='d-none' crossOrigin="anonymous" />
                            <hr/>
                            
                            { this.state.selectedMetric != '' && this.state.data != undefined ?
                                <Row className="justify-content-between">
                                    <Col className="align-self-center">
                                        <span className="text-black-50">Select a time period to show and download an image to share.</span>
                                    </Col>
                                    <Col xs={12} md="auto" className={window.innerWidth < 800 ? 'text-center my-3' : 'my-0'}>
                                        <Button onClick={() => this.downloadData()} variant="light-grey" style={{color: "#094151"}}><FontAwesomeIcon icon={faFileDownload} /> Download Data</Button>
                                    </Col>
                                    <Col xs={12} md="auto" className={window.innerWidth < 800 ? 'text-center my-3' : 'my-0'}>
                                        <Button onClick={() => this.downloadChart()} variant="light-grey" style={{color: "#094151"}}><FontAwesomeIcon icon={faFileDownload} /> Download Image</Button>
                                    </Col>
                                    <Col md="auto" className="align-self-center">
                                        <span className="text-black-50">Source: <a className="text-black-50" target="_blank" href={_.filter(settings.texts, function(def) { return def.name == 'source'})[0].link}>{_.filter(settings.texts, function(def) { return def.name == 'source'})[0].link_text}</a></span>
                                    </Col>
                                </Row>
                                : ''
                            }

                            
                            <hr/>

                            <Row className="justify-content-center m-5">
                                <Col>
                                    <p className="fs-5">The Africa Data Hub Inflation Observer is created to help journalists, researchers and civil society organisations access up to date information about inflation indicators in their country and compare it with their neighbours. </p>
                                </Col>
                                <Col>
                                    <p className="text-black-50">Do you have a question about these numbers? Have you spotted a mistake or do they look different to the ones reported in your local press (especially in South Africa)? See <a href="https://africadatahub.org/data-resources/inflation-observer#about" target="_parent">this page</a> for more information about how this data is compiled. </p>
                                </Col>
                            </Row>
                            <SocialMedia />
                        </Card.Body>
                    </Card>

                    
                    <Card className="border-0 rounded mt-4">
                        <Card.Body>
                            <Row className="align-items-end">
                                <Col></Col>
                                <Col xs="auto">
                                    <div style={{display: 'inline-block', position: 'relative', top: '0.2em', right: '0.6em'}}>POWERED BY</div> <a target="_blank" href="https://www.openup.org.za"><img style={{width: '100px'}} src="https://brand-assets.openup.org.za/openup/PNG/Standard/openup-logo-1200x267.png"/></a>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                        
                </Container>
            </div>
        );
    }
}
