import axios from 'axios';

/**
 * Uploads an image file to the server.
 * @param file The image file to upload.
 * @returns A promise that resolves to the URL of the uploaded image.
 */
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.url) {
      return response.data.url;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
};
