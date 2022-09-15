import React from 'react';
import ReactDOM from 'react-dom';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import { CountrySelect } from '../components/CountrySelect';


export class Home extends React.Component {

    render() {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center">
                <Container>
                    <Card> 
                        <Card.Body className="p-5">
                            <Row>
                                <Col className="text-center">
                                    <h1>Africa Inflation Observer</h1>
                                    <p className="fs-4">
                                        Use the dropdown below to view a country's historic inflation data.
                                    </p>
                                    <CountrySelect />
                                </Col>
                            </Row>

                           
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        );
    }
}