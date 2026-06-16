const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { imagenes } = JSON.parse(event.body);

        if (!imagenes || imagenes.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "No se recibieron imágenes." })
            };
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const parts = [
            {
                text: `Sos un asistente que extrae datos de afiliación a obras sociales desde imágenes de documentos (DNI, recibo de sueldo, notas del afiliado).
Analizá todas las imágenes adjuntas y extraé la siguiente información en formato de texto plano, con el formato exacto que se indica:

APELLIDO Y NOMBRE: 
DNI: 
FECHA DE NACIMIENTO: 
CUIL: 
DOMICILIO: 
LOCALIDAD: 
PROVINCIA: 
CÓDIGO POSTAL: 
TELÉFONO: 
EMAIL: 
EMPLEADOR/EMPRESA: 
CUIT EMPLEADOR: 
CATEGORÍA/CARGO: 
SUELDO BRUTO: 
SUELDO NETO: 
FECHA DE INGRESO: 
OBRA SOCIAL ACTUAL: 
OBSERVACIONES: 

Si algún dato no está disponible en las imágenes, escribí "No encontrado" en ese campo.
Respondé ÚNICAMENTE con el texto plano con los datos, sin explicaciones adicionales.`
            },
            ...imagenes.map(img => ({
                inlineData: {
                    mimeType: img.mimeType,
                    data: img.data
                }
            }))
        ];

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