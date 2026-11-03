import { API_BASE_URL } from '../config';

export const fetchMedication = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/medications/search?q=${query}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Error fetching medication:", error);
    throw error;
  }
};