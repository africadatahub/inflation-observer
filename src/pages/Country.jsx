import React from 'react';

import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

import { ResponsiveContainer, ComposedChart, Bar, Brush, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { saveAs } from 'file-saver';

import { CountrySelect } from '../components/CountrySelect';

import getCountryISO2 from 'country-iso-3-to-2';
import ReactCountryFlag from 'react-country-flag';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFileDownload } from '@fortawesome/free-solid-svg-icons';

import * as settings from '../data/settings.json';
import { locationToUrl, urlToLocation } from '../utils/func.js';
import { Collapse } from 'react-bootstrap';




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
        pymChild.sendHeight();
        let self = this;

        let country = urlToLocation(window.location.pathname.replace('/',''));

        axios.get(settings.api.url + 'action/datastore_search_sql?sql=SELECT%20*%20from%20"' + settings.api.countryData + '"%20WHERE%20iso_code%20LIKE%20%27' + country.iso_code + '%27',
            { headers: {
                "Authorization": process.env.CKAN
            }
        })
        .then(function(response) {
            
            let records = _.sortBy(response.data.result.records, ['date']);

            self.setState({
                selectedCountry: country,
                selectedCountryIso2: getCountryISO2(country.iso_code),
                selectedMetric: settings.countryChart.selectedBaseMetric,
                data: records,
                loading: false
            });
        })
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
        image.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.width = width+10;
            canvas.height = height+10;
            let context = canvas.getContext('2d');
            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillRect(0,0,canvas.width,canvas.height);
            context.fillStyle = 'rgba(0,0,0,0.3)';
            context.font = 'bold 24px Arial';
            context.fillText('Africa Data Hub', canvas.width - 250, 30);
            context.drawImage(image, 0, 0, context.canvas.width-10, context.canvas.height-10);
            let jpeg = canvas.toDataURL('image/jpeg', 1.0);
            saveAs(jpeg, self.state.selectedCountry.location.replace(' ', '-') + '--' + _.find(settings.indicators, indicator => { return indicator.indicator_code == self.state.selectedMetric}).indicator_name);
        };

        image.src = blobURL;

    }

    render() {
        let self = this;

       

        return (
            <div>
                <Container>  
                    <Card className='border-0 rounded mt-4'>
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

                                                <YAxis yAxisId="left" orientation="left" stroke="#99b3bb" domain={[_.minBy(this.state.data.map(day => day[this.state.selectedMetric] == 'NaN' ? null : parseFloat(day[this.state.selectedMetric]))),_.maxBy(this.state.data.map(day => day[this.state.selectedMetric] == 'NaN' ? null : parseFloat(day[this.state.selectedMetric])))]}/>
                                                
                                                <ReferenceLine y={0} yAxisId="left" stroke="red" strokeDasharray="3 3" />
                                                
                                                <CartesianGrid strokeDasharray="3 3"/>

                                                <Tooltip content={<CustomTooltip/>} />
                                                
                                                {this.state.selectedMetric != '' && (<Line type="monotone" yAxisId="left" dot={false} dataKey={this.state.selectedMetric} strokeWidth={3} stroke="#089fd1" />)}

                                                <Brush dataKey="date" height={30} stroke="#8eb4bf"  tickFormatter={ tick => moment(tick).format('MM/YY') }/>
                                            </ComposedChart>
                                        </ResponsiveContainer>)
                                    }
                                </>
                            </div>
                            
                            <hr/>
                            
                            { this.state.selectedMetric != '' ?
                                <Row className="justify-content-between">
                                    <Col className="align-self-center">
                                        <span className="text-black-50">Select a time period to show and download an image to share.</span>
                                    </Col>
                                    <Col xs={12} md="auto" className={window.innerWidth < 800 ? 'text-center my-3' : 'my-0'}>
                                        <Button onClick={() => this.downloadChart()} variant="light-grey" style={{color: "#094151"}}><FontAwesomeIcon icon={faFileDownload} />&nbsp;Download Image</Button>
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
                                    <p className="fs-5">The Africa Data Hub Consumer Price Indicator Explorer is created to help journalists, researchers and civil society organisations access up to date information about inflation indicators in their country and compare it with their neighbours. All numbers shown are percentage change, year-on-year, for the given indicator.</p>
                                </Col>
                                <Col>
                                    <p className="text-black-50">Do you have a question about these numbers? Have you spotted a mistake or do they look different to the ones reported in your local press? See this page for more information about how this data is compiled.</p>
                                </Col>
                            </Row>
                        
                            
                            
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        );
    }
}
