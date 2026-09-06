import LandingPage from "../components/LandingPage";

/**
 * Register Route Wrapper
 * Renders the sleek single non-scrollable Landing Canvas with the Register
 * bottom-up sheet automatically presented via spring physics.
 */
function Register() {
  return <LandingPage initialAuthSheet="register" />;
}

export default Register;