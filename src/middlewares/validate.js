/**
 * Middleware: validasi req[source] (body/query/params) terhadap Zod schema.
 * Response error mengikuti bentuk standar: { error, message, details[] }.
 */
const validate = (schema, source = "body") => (req, res, next) => {
    // multipart/form-data tanpa field sama sekali membuat req.body jadi undefined
    // (bukan {}) - perlakukan sebagai objek kosong supaya validasi tidak salah
    // menganggapnya "body hilang" alih-alih "body ada tapi semua field kosong".
    const input = source === "body" && req.body === undefined ? {} : req[source];
    const result = schema.safeParse(input);

    if (!result.success) {
        return res.status(400).json({
            error: "ValidationError",
            message: "Request validation failed",
            details: result.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    if (source === "query") {
        // Express 5: req.query adalah getter tanpa setter, tidak bisa di-reassign langsung.
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, result.data);
    } else {
        req[source] = result.data; // parsed + defaulted values
    }
    next();
};

export default validate;
