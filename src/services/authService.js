import api from '../api/axios';

export const getToken = () => localStorage.getItem('token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const setTokens = ({ access_token, refresh_token }) => {
  localStorage.setItem('token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const refreshAccessToken = async () => {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new Error('Refresh token não encontrado');

  const response = await api.post('/auth/refresh', { refresh_token });
  const { access_token } = response.data;

  localStorage.setItem('token', access_token);
  return access_token;
};

// ✅ Adicionando a função login
export const login = async (email, senha) => {
  const response = await api.post('/auth/login', { email, senha });
  const { access_token, refresh_token } = response.data;

  setTokens({ access_token, refresh_token });
};
