
document.addEventListener('DOMContentLoaded', () => {

   
    document.getElementById('btnProcesar').addEventListener('click', async () => {
        const input = document.getElementById('inputImagenes');
        const divEstado = document.getElementById('estado');
        
        if (!input || !divEstado) {
            console.error("No se encontraron los elementos en el HTML. Verificá los IDs.");
            return;
        }

        if (input.files.length === 0) {
            alert("Por favor, seleccioná al menos una imagen.");
            return;
        }

        divEstado.innerText = "Procesando imágenes, por favor esperá...";

        const promesas = Array.from(input.files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve({
                    mimeType: file.type,
                    data: reader.result.split(',')[1]
                });
                reader.onerror = error => reject(error);
            });
        });

        try {
            const imagenesBase64 = await Promise.all(promesas);

            const response = await fetch('/.netlify/functions/procesar-imagenes', {
                method: 'POST',
                body: JSON.stringify({ imagenes: imagenesBase64 }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error("Error en el servidor: " + response.status);

            const resultado = await response.json();

            if (resultado.error) {
                throw new Error(resultado.error);
            }

            const blob = new Blob([resultado.texto], { type: 'text/plain' });
            const enlace = document.createElement('a');
            enlace.href = URL.createObjectURL(blob);
            enlace.download = 'Datos_Afiliacion.txt';
            enlace.click();

            divEstado.innerText = "¡Archivo generado con éxito!";
        } catch (error) {
            console.error(error);
            divEstado.innerText = "Hubo un error al procesar las imágenes.";
        }
    });


});