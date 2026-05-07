import Article from "../models/articleModel.js";

// GET /articles
export const getAll = async (req, res) => {
  try {
    const { data, error } = await Article.findAll();

    if (error) return res.status(400).json(error);

    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /articles/:id
export const getOne = async (req, res) => {
  try {
    const { data, error } = await Article.findById(req.params.id);

    if (error) return res.status(404).json({ error: "Article not found" });

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /articles
export const createOne = async (req, res) => {
  try {
    const { data, error } = await Article.create(req.body);

    if (error) return res.status(400).json(error);

    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// PUT /articles/:id
export const updateOne = async (req, res) => {
  try {
    // Pastikan artikel ada dulu
    const { data: existing, error: findError } = await Article.findById(
      req.params.id
    );

    if (findError || !existing) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Hanya update field yang dikirim, sisanya pakai data lama
    const fields = {
      title: req.body.title ?? existing.title,
      body: req.body.body ?? existing.body,
    };

    const { data, error } = await Article.update(req.params.id, fields);

    if (error) return res.status(400).json(error);

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /articles/:id
export const deleteOne = async (req, res) => {
  try {
    const { error } = await Article.remove(req.params.id);

    if (error) return res.status(400).json(error);

    // Kembalikan semua data setelah delete
    const { data: allData, error: fetchError } = await Article.findAll();

    if (fetchError) return res.status(400).json(fetchError);

    return res.status(200).json(allData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
