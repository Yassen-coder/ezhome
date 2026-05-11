import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const setAdminToken = (token) => {
  if (token) api.defaults.headers.common["X-Admin-Token"] = token;
  else delete api.defaults.headers.common["X-Admin-Token"];
};

export const getAffiliateClickUrl = (productId) => `${API}/click/${productId}`;
