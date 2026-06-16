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

        // Construir el array de partes: texto + imágenes
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

        const result = await model.generateContent(parts);
        const texto = result.response.text();

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