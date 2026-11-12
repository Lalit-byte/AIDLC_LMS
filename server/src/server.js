import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 LMS Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check ready at http://localhost:${PORT}/api/health`);
});
