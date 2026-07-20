import React from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import axiosInstance from "../../axiosInstance";

const Register = () => {
  const navigate = useNavigate();
  const { fetchDetails, setLoggedIn, setUserChanged } = useUser();

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = React.useState(false);

  const [message, setMessage] = React.useState({
    green: "",
    red: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage({ green: "", red: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};

    for (const key in formData) {
      if (formData[key].trim() === "") {
        newErrors[key] = `Enter valid ${key}`;
      } else {
        newErrors[key] = "";
      }
    }

    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((v) => v !== "");
    if (hasError) return;

    setLoading(true);

    try {
      const res = await axiosInstance.post("/api/user/register", formData);

      setMessage({ green: res.data.message, red: "" });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.id);

      setLoggedIn(true);
      setUserChanged(true);
      await fetchDetails();

      setFormData({ name: "", email: "", password: "" });
    } catch (err) {
      const backendMsg = err.response?.data?.message;

      // 👇 Login-style handling (NO object render)
      if (typeof backendMsg === "string") {
        setMessage({ green: "", red: backendMsg });
      } else {
        setMessage({
          green: "",
          red: "Registration failed. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOkClick() {
    if (message.green) {
      navigate("/feed");
    }
    setMessage({ green: "", red: "" });
  }

  return (
    <div className="register-container">
      <h1 className="heading">Register your account</h1>

      <form onSubmit={handleSubmit}>
        <div className="element">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div className="element">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>

        <div className="element">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && (
            <p className="error-text">{errors.password}</p>
          )}
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Submitting.." : "Register"}
        </button>
      </form>

      {(message.green || message.red) && (
        <div className="message-overlay">
          <div className="message-box">
            <div className="alert-box">
              <div className={`alert ${message.green ? "success" : "error"}`}>
                <p>{message.green || message.red}</p>
              </div>
              <button className="alert-ok-btn" onClick={handleOkClick}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
