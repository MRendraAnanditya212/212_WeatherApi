const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
    const q = (req.query.q || "jakarta").toString().trim();

    if (!q) {
        return res.status(400).json({
            message: "Nama lokasi wajib diisi"
        });
    }

    const apiKey = "TmW3n2IbOKaZxkghOoYB";
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const feature = response.data?.features?.[0];

        if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) {
            return res.status(404).json({
                message: "Lokasi tidak ditemukan"
            });
        }

        const [longitude, latitude] = feature.geometry.coordinates;
        const context = feature.context || [];

        const getContextText = (prefix) => {
            const item = context.find((entry) => (entry.id || "").startsWith(prefix));
            return item?.text || "";
        };

        const negara = getContextText("country") || feature.properties?.country || "Tidak diketahui";
        const provinsi = getContextText("region") || feature.properties?.region || "Tidak diketahui";
        const kecamatan = getContextText("locality") || getContextText("district") || feature.properties?.locality || feature.properties?.county || feature.text || "Tidak diketahui";

        return res.json({
            input: q,
            negara,
            provinsi,
            kecamatan,
            longitude,
            latitude
        });

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            message: "Gagal mengambil data dari MapTiler"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});