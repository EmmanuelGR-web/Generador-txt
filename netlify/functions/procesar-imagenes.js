const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Esta línea es la clave: le pedimos la lista de modelos
        const modelList = await genAI.listModels();
        
        return {
            statusCode: 200,
            body: JSON.stringify(modelList.models.map(m => m.name))
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};