import "dotenv/config";
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const time = new Date().toLocaleTimeString();
  const baseUrl = `http://localhost:${PORT}`;

  console.log(`${time}: Server is running on port ${PORT}...`);
  console.log(`${time}: Base API URL  -> ${baseUrl}`);
  console.log(`${time}: Swagger docs  -> ${baseUrl}/api-docs`);
});
