import { MenuItem, MenuParams, ValidValues, ParsedResponse } from '@/types/chat';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

const generateGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
};

const generateMenuRecommendation = async (
  menuItems: MenuItem[],
  params: MenuParams
): Promise<string> => {
  try {
    if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
      throw new Error('No hay menús disponibles para analizar');
    }

    if (!params || !params.tipo_reunion || !params.sede) {
      throw new Error('Faltan parámetros necesarios para la búsqueda de menús');
    }

    // Enviamos todos los menús disponibles para que la IA haga el análisis
    const prompt = generateMenuRecommendationPrompt(menuItems, params);
    const response = await generateGeminiResponse(prompt);
    return response;
  } catch (error: any) {
    console.error('Error en generateMenuRecommendation:', error);
    throw new Error(`Error al generar la recomendación del menú: ${error.message || 'Error desconocido'}`);
  }
};

export { generateMenuRecommendation };

const parseUserInput = async (input: string, context: { menuParams: Partial<MenuParams>, validValues: ValidValues }): Promise<ParsedResponse> => {
  const prompt = `
    Eres un asistente experto en planificación de reuniones. Tu tarea es analizar el mensaje del usuario y extraer información relevante para una recomendación de menú.

    Entrada del usuario: "${input}"

    Información actual recopilada:
    ${Object.entries(context.menuParams)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}

    Valores válidos disponibles:
    Tipos de reunión: ${context.validValues.tipos.join(', ')}
    Sedes: ${context.validValues.sedes.map(s => s.nombre).join(', ')}

    INSTRUCCIONES:
    1. Si el usuario no ha proporcionado información válida o es un saludo inicial, responde con un saludo y solicita el tipo de reunión.
    2. Analiza el mensaje para extraer cualquier información relevante sobre:
       - Tipo de reunión
       - Sede
       - Fecha
       - Hora
       - Número de asistentes
       - Restricciones alimentarias
       - Presupuesto
       - Nombre del solicitante
    3. Si el usuario menciona restricciones alimentarias, asegúrate de capturar todos los detalles.
    4. Si el usuario está preguntando algo que no podemos responder, indícale amablemente que solo podemos ayudarle con la planificación de reuniones.
    5. Si el usuario está agradeciendo o haciendo preguntas después de recibir una recomendación, finaliza la conversación actual y ofrece ayuda para una nueva reunión.

    Responde SOLO con un objeto JSON válido con esta estructura:
    {
      "type": "greeting" | "menu_info" | "restrictions" | "unknown" | "conversation_end",
      "extractedInfo": {
        "tipo_reunion": string | null,
        "sede": string | null,
        "fecha": string | null,
        "hora": string | null,
        "asistentes": number | null,
        "restricciones": string | null,
        "presupuesto": number | null,
        "solicitante": string | null
      },
      "message": string,
      "shouldEndConversation": boolean
    }

    REGLAS PARA EL MENSAJE:
    1. Si es el primer mensaje o no hay información, saluda y pregunta por el tipo de reunión
    2. Si se extrajo nueva información, confírmala y pregunta por la siguiente información faltante
    3. Si no se extrajo información nueva, pide amablemente la información que falta
    4. Si se completó toda la información, indica que procederás con la recomendación
    5. Si el usuario está preguntando algo fuera de tema, indícale amablemente que solo podemos ayudarle con la planificación de reuniones
    6. Si el usuario está agradeciendo o haciendo preguntas después de una recomendación:
       - Agradece su interés
       - Indica que la consulta actual ha finalizado
       - Ofrece ayuda para planificar una nueva reunión
    7. Usa formato markdown para mejorar la legibilidad
    8. Sé amigable y natural en tus respuestas
  `;

  try {
    const response = await generateGeminiResponse(prompt);
    // Limpiar la respuesta de cualquier texto adicional
    const cleanResponse = response.trim().replace(/^```json\s*|\s*```$/g, '');
    const parsedResponse = JSON.parse(cleanResponse) as ParsedResponse;
    
    // Validar la estructura de la respuesta
    if (!parsedResponse.type || !parsedResponse.extractedInfo || !parsedResponse.message) {
      throw new Error('Invalid response structure');
    }

    // Si el usuario está agradeciendo o haciendo preguntas después de una recomendación
    if (parsedResponse.type === 'conversation_end') {
      parsedResponse.shouldEndConversation = true;
      parsedResponse.extractedInfo = {}; // Limpiar la información para una nueva conversación
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error parsing user input:', error);
    // En caso de error, devolver un saludo inicial
    return {
      type: 'greeting',
      extractedInfo: {},
      message: '¡Hola! Soy tu asistente para planificación de reuniones. ¿Qué tipo de reunión necesitas organizar?',
      shouldEndConversation: false
    };
  }
};

export { parseUserInput };

export const generateResponse = async (prompt: string): Promise<string> => {
  try {
    return await generateGeminiResponse(prompt);
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};

export const validateUserResponse = async (
  question: string,
  userInput: string,
  validValues: ValidValues
): Promise<{ isValid: boolean; message: string; matchedValue?: string }> => {
  try {
    if (!API_KEY) {
      throw new Error('Missing Gemini API key');
    }

    // Si es la pregunta del nombre de usuario, usar una validación más flexible
    if (question.includes('nombre de usuario')) {
      if (userInput.trim().length === 0) {
        return {
          isValid: false,
          message: 'Por favor, ingresa tu nombre de usuario.'
        };
      }
      return {
        isValid: true,
        message: `Gracias ${userInput}.`,
        matchedValue: userInput
      };
    }

    const prompt = `
      You are a validation assistant. Your task is to validate a user's response to a question.
      
      Question: ${question}
      User's response: ${userInput}
      
      Valid values from the database:
      - Types: ${validValues.tipos.join(', ')}
      - Venues: ${validValues.sedes.map(s => s.nombre).join(', ')}
      - Cities: ${validValues.ciudades.map(c => c.nombre).join(', ')}
      - Providers: ${validValues.proveedores.map(p => p.nombre).join(', ')}
      
      IMPORTANT: You must respond with a valid JSON object and nothing else. No explanations, no additional text.
      The JSON object must have exactly these fields:
      - isValid: boolean (true if the response is valid, false otherwise)
      - message: string (a message explaining why it's valid or invalid)
      - matchedValue: string (optional, only if there's a valid match from the valid values list)
      
      Example valid response:
      {
        "isValid": true,
        "message": "La respuesta es válida",
        "matchedValue": "desayuno"
      }
      
      Example invalid response:
      {
        "isValid": false,
        "message": "La respuesta no coincide con ningún valor válido"
      }
      
      Your response must be a valid JSON object following this exact format.
    `;

    console.log('Sending validation request to Gemini:', {
      question,
      userInput,
      validValues
    });

    const responseText = await generateGeminiResponse(prompt);
    console.log('Received response from Gemini:', responseText);

    try {
      // Limpiar la respuesta para asegurar que sea un JSON válido
      const cleanResponse = responseText.trim().replace(/^```json\s*|\s*```$/g, '');
      const validation = JSON.parse(cleanResponse);

      // Validar que la respuesta tenga la estructura correcta
      if (typeof validation.isValid !== 'boolean' || typeof validation.message !== 'string') {
        throw new Error('Invalid response structure from Gemini');
      }

      return validation;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response format from Gemini');
    }
  } catch (error) {
    console.error('Error in validateUserResponse:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return {
      isValid: false,
      message: `Error al validar la respuesta: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

export const generateMenuRecommendationPrompt = (menuItems: MenuItem[], params: MenuParams): string => {
  return `
Necesito que me ayudes con la siguiente decisión:

${JSON.stringify(menuItems, null, 2)}

Tengo esta reunión:
- Tipo de reunión: ${params.tipo_reunion}
- Ciudad o Sede donde se realizará la reunión: ${params.sede}
- Fecha y Horario aproximado del evento: ${params.fecha}, ${params.hora}
- Número estimado de participantes: ${params.asistentes}
- Presupuesto por persona: $${params.presupuesto}
- ¿Existen restricciones alimentarias o alergias que debamos considerar?: ${params.restricciones? 'Sí, ' + params.restricciones : 'Ninguna'}

¿Qué menu me recomiendas? Si no hay ninguno que se adapte, dimelo`;
}; 