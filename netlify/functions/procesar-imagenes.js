const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const cuerpo = JSON.parse(event.body);
        const imagenes = cuerpo.imagenes;

        // Configurar la API de Gemini (la clave se guarda en las variables de entorno de Netlify)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // Dar formato a las imágenes para la API
        const imageParts = imagenes.map(img => ({
            inlineData: {
                data: img.data,
                mimeType: img.mimeType
            }
        }));

        // El Prompt estricto basado en tu ejemplo
        const prompt = `
        Sos un asistente de extracción de datos para afiliaciones de una obra social. 
        Analizá las siguientes imágenes (DNI, recibos de sueldo, notas) y extraé la información solicitada.
        DEBES generar un texto exactamente con la siguiente estructura, reemplazando los corchetes con los datos extraídos. Si un dato no está en las fotos, poné "Dato no encontrado". No agregues ningún saludo, ni formato Markdown, ni texto extra. Solo esta estructura exacta:

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
        [Repetir este bloque por cada familiar encontrado en las imágenes]
        *Apellido y Nombre: [Dato]
        *Parentesco: [Dato]
        *Edad: [Dato] años
        *DNI: [Dato]
        *Fecha de Nacimiento: [DD/MM/AAAA]
        *Altura: [Dato] cm
        *Peso: [Dato] kg
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const textoGenerado = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ texto: textoGenerado })
        };

    } catch (error) {
        console.error("Error en la IA:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Fallo al procesar las imágenes con la IA." })
        };
    }
};