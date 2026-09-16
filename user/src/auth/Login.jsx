import { useLocation } from "react-router-dom";
import LandingPage from "../components/LandingPage";

/**
 * Login Route Wrapper
 * Renders the sleek single non-scrollable Landing Canvas with the Login
 * bottom-up sheet automatically presented via spring physics.
 */
function Login() {
  const location = useLocation();

  return (
    <LandingPage
      initialAuthSheet="login"
      initialEmail={location.state?.email || ""}
      initialSuccessMessage={location.state?.successMessage || ""}
    />
  );
}

export default Login;