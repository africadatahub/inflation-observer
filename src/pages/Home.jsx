import React from 'react';
import ReactDOM from 'react-dom';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import { CountrySelect } from '../components/CountrySelect';

export class Home extends React.Component {

    componentDidMount() {
        
    }

    render() {
        return (
            <div className="d-flex justify-content-center align-items-center mt-4">
                <span className="fs-5">Select countries to visualise</span>
                <CountrySelect />
            </div>
        );
    }
}