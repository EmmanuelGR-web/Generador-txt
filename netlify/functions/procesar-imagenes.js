const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    console.log("--- INICIANDO FUNCIÓN ---");

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Verificar si la KEY existe
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("ERROR: GEMINI_API_KEY no encontrada en variables de entorno");
            throw new Error("API_KEY_MISSING");
        }
        console.log("API Key detectada correctamente");

        const cuerpo = JSON.parse(event.body);
        if (!cuerpo.imagenes) {
            console.error("ERROR: No se recibieron imágenes en el cuerpo de la petición");
            throw new Error("NO_IMAGES_PROVIDED");
        }
        
        console.log(`Procesando ${cuerpo.imagenes.length} imágenes...`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageParts = cuerpo.imagenes.map(img => ({
            inlineData: {
                data: img.data,
                mimeType: img.mimeType
            }
        }));

        const prompt = "Extrae los datos solicitados en formato de texto. Si no hay datos, pon 'Dato no encontrado'.";

        console.log("Llamando a la API de Gemini...");
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const textoGenerado = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ texto: textoGenerado })
        };

    } catch (error) {
        console.error("ERROR EN EL CATCH:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message, stack: error.stack })
        };
    }
};