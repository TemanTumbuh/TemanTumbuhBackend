import express from "express";
import env from "dotenv";
import { createClient } from '@supabase/supabase-js'

env.config();

// Validasi env variables
if (!process.env.DATABASE_URL || !process.env.DATABASE_KEY) {
  console.error("Missing DATABASE_URL or DATABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_KEY);
const app = express();

app.use(express.json());

app.get("/", (_, response) =>
  response.json({ info: "Express app with Supabase" })
);

// Get all articles
app.get("/articles", async (_, response) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select('*');  // ← eksplisit pakai '*'

    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
      return response.status(400).json(error);
    }

    return response.status(200).json(data ?? []); // ← pakai .json() bukan .send()
  } catch (error) {
    console.error(error);
    return response.status(500).send({ error: error.message });
  }
});

// Get an article
app.get("/articles/:id", async (request, response) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select('*')
      .eq("id", request.params.id)
      .single(); // ← pakai .single() untuk satu record

    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
      return response.status(404).json({ error: "Article not found" });
    }

    return response.status(200).json(data);
  } catch (error) {
    console.error(error);
    return response.status(500).send({ error: error.message });
  }
});

// Post an article
app.post("/articles", async (request, response) => {
  try {
    console.log("Body:", request.body);

    const { data, error } = await supabase
      .from("posts")
      .insert(request.body)
      .select('*'); // ← tambahkan .select() agar data dikembalikan

    if (error) {
      return response.status(400).json(error);
    }

    return response.status(201).json(data);
  } catch (error) {
    console.error(error);
    return response.status(500).send({ error: error.message });
  }
});

// Update an article
app.put("/articles/:id", async (request, response) => {
  try {
    // Cek apakah artikel ada
    const { data: existingData, error: selectError } = await supabase
      .from("posts")
      .select('*')
      .eq("id", request.params.id)
      .single();

    if (selectError || !existingData) {
      return response.status(404).json({ error: "Article not found" });
    }

    // Update artikel
    const { data: updatedData, error: updatedError } = await supabase
      .from("posts")
      .update({
        title: request.body.title ?? existingData.title,
        body: request.body.body ?? existingData.body,
      })
      .eq("id", request.params.id)
      .select('*'); // ← tambahkan .select() agar data dikembalikan

    if (updatedError) {
      return response.status(400).json(updatedError);
    }

    return response.status(200).json(updatedData);
  } catch (error) {
    console.error(error);
    return response.status(500).send({ error: error.message });
  }
});

// Delete an article
app.delete("/articles/:id", async (request, response) => {
  try {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", request.params.id);

    if (error) {
      return response.status(400).json(error);
    }

    // Kembalikan semua data setelah delete
    const { data: allData, error: selectError } = await supabase
      .from("posts")
      .select('*');

    if (selectError) {
      return response.status(400).json(selectError);
    }

    return response.status(200).json(allData);
  } catch (error) {
    console.error(error);
    return response.status(500).send({ error: error.message });
  }
});

// ← app.listen() dipindah ke paling bawah
app.listen(process.env.PORT, () =>
  console.log(
    new Date().toLocaleTimeString() +
      `: Server is running on port ${process.env.PORT}...`
  )
);