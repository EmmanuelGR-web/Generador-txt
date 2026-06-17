const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let parts;

        if (body.modo === 'calcular') {
            // Nuevo modo: recibe partes directamente (texto + imágenes)
            parts = body.partes;
        } else {
            // Modo legacy
            const { imagenes } = body;
            if (!imagenes || imagenes.length === 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "No se recibieron imágenes." })
                };
            }
            parts = [
                { text: "Extraé los datos de afiliación de estas imágenes." },
                ...imagenes.map(img => ({
                    inlineData: { mimeType: img.mimeType, data: img.data }
                }))
            ];
        }

        // Reintento automático hasta 3 veces si hay error 503
        let resultado;
        for (let intento = 1; intento <= 3; intento++) {
            try {
                resultado = await model.generateContent(parts);
                break;
            } catch (err) {
                if (err.status === 503 && intento < 3) {
                    await new Promise(r => setTimeout(r, 3000 * intento));
                } else {
                    throw err;
                }
            }
        }

        const texto = resultado.response.text();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texto })
        };

    } catch (error) {
        console.error("Error en procesar-imagenes:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
