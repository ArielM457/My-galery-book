const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiUrl = 'https://functions-auth-capstone-c6c6ctfagwajbjdm.eastus-01.azurewebsites.net/api';

export const APP_API_URL = (configuredApiUrl && configuredApiUrl.length > 0 ? configuredApiUrl : defaultApiUrl).replace(/\/+$/, '');
