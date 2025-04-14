import axios from 'axios';
import '../common/http'
import { baseURL } from '../utilities/constants';

const BASE_URL = baseURL;

export const testConnection = async (data) => {
  const response = await axios.post(`${BASE_URL}/connections/test`, {
    db_type: data.databaseType,
    db_hostname: data.hostname,
    db_port: data.port,
    user_id: data.userId,
    password: data.password,
    database: data.name // name= db name in ths context
  });
  return response.data;
};

export const createConnection = async (data) => {
  const response = await axios.post(`${BASE_URL}/connections/`, {
    name: data.name,
    description: data.description,
    db_type: data.databaseType,
    db_hostname: data.hostname,
    db_port: data.port,
    user_id: data.userId,
    password: data.password,
    database: data.name 
  });
  return response.data;
};

export const getAllConnections = async () => {
  const response = await axios.get(`${BASE_URL}/connections/`);
  return response.data;
};

export const getConnectionById = async (id) => {
  const response = await axios.get(`${BASE_URL}/connections/${id}`);
  return response.data;
};

export const updateConnection = async (id, data) => {
  const response = await axios.put(`${BASE_URL}/connections/${id}`, data);
  return response.data;
};

export const deleteConnection = async (id) => {
  const response = await axios.delete(`${BASE_URL}/connections/${id}`);
  return response.data;
};
