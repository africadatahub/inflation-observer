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
                <Container>
                    <Card> 
                        <Card.Body className="p-5">
                            <Row>
                                <Col className="text-center">
                                    <p className="fs-4">
                                        Use the dropdown menu to view CPI data for your country.
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