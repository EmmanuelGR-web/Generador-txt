const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const cuerpo = JSON.parse(event.body);
        const imagenes = cuerpo.imagenes;

        // Verificar que la clave exista
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY no está configurada en Netlify");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // CORRECCIÓN: Usar modelo multimodal
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageParts = imagenes.map(img => ({
            inlineData: {
                data: img.data,
                mimeType: img.mimeType
            }
        }));

        const prompt = `Sos un asistente de extracción de datos para afiliaciones de una obra social. Analizá las imágenes (DNI, recibos, notas) y extraé la información.
        DEBES generar un texto con esta estructura exacta. Si un dato no está, poné "Dato no encontrado". No agregues Markdown ni explicaciones:

        DATOS DEL TITULAR
        *Apellido y Nombre del titular: [Dato]
        *Plan elegido : [Dato]
        *Capitas: [Dato]
        *Edad: [Dato] años
        *DNI: [Dato]
        *Fecha de nacimiento: [DD/MM/AAAA]
        *Teléfono de contacto : [Dato]
        *Aporte : $[Dato]
        *Email : [Dato]
        *Altura: [Dato] cm
        *Peso: [Dato] kg
        *clave fiscal: [Dato]

        DATOS DEL EMPLEADOR
        *Cuit Empleador: [Dato]
        *Empleador: [Dato]
        *Sueldo Bruto sujeto aportes: $[Dato]
        *Aporte calculado: $[Dato]

        DATOS DEL GRUPO FAMILIAR
        *Apellido y Nombre: [Dato]
        *Parentesco: [Dato]
        *Edad: [Dato] años
        *DNI: [Dato]
        *Fecha de Nacimiento: [DD/MM/AAAA]
        *Altura: [Dato] cm
        *Peso: [Dato] kg`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const textoGenerado = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ texto: textoGenerado })
        };

    } catch (error) {
        console.error("ERROR DETALLADO:", error);
        return {
            statusCode: 500,
            // Esto es importante: te devuelve el error real al navegador
            body: JSON.stringify({ error: error.message }) 
        };
    }
};