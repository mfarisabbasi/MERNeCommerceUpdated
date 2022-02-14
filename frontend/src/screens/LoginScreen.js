import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Form, Button, Row, Col } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import FormContainer from "../components/FormContainer";
import { login, googleLogin } from "../actions/userActions";
import { GoogleLogin } from "react-google-login";
import axios from "axios";

const LoginScreen = ({ location, history }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

  const redirect = location.search ? location.search.split("=")[1] : "/";

  useEffect(() => {
    if (userInfo) {
      history.push(redirect);
    }
  }, [history, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

  const responseSuccess = (res) => {
    dispatch(googleLogin(res.tokenId));
    // axios({
    //   method: "POST",
    //   url: "http://localhost:5000/api/users/login/google",
    //   data: { tokenId: res.tokenId },
    // }).then((response) => {
    //   console.log(response);
    //   localStorage.setItem("userInfo", JSON.stringify(response.data));
    // });
  };
  const responseFailure = (res) => {
    console.log(res);
  };
  return (
    <FormContainer>
      <h1>Sign In</h1>
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="email">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></Form.Control>
        </Form.Group>
        <Form.Group controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></Form.Control>
        </Form.Group>
        <Button type="submit" variant="primary">
          Sign In
        </Button>
        OR
        <GoogleLogin
          clientId="1085866666703-1903vd6vuhr4tftd6nltucqru0j43q2l.apps.googleusercontent.com"
          buttonText="Signin With Google"
          onSuccess={responseSuccess}
          onFailure={responseFailure}
          cookiePolicy={"single_host_origin"}
        />
      </Form>
      <Row className="py-3">
        <Col>
          New Customer?{" "}
          <Link to={redirect ? `/register?redirect=${redirect}` : "/register"}>
            Register
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default LoginScreen;
