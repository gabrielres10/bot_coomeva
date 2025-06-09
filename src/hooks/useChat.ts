import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState, MenuParams, MenuItem, ValidValues, ConversationContext, ParsedResponse } from '@/types/chat';
import { getMenuRecommendations, getValidValues, getMenuItems } from '@/lib/api';
import { parseUserInput, generateMenuRecommendation } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';

// Respuestas ficticias del bot para simular conversación
const BOT_RESPONSES = [
  "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  "Entiendo tu consulta. Déjame procesarla...",
  "Esa es una excelente pregunta. Te puedo ayudar con eso.",
  "¡Por supuesto! Estoy aquí para asistirte.",
  "Gracias por tu mensaje. ¿Hay algo más en lo que pueda ayudarte?",
  "Me alegra poder conversar contigo. ¿Qué más te gustaría saber?",
  "Perfecto, entiendo lo que necesitas. Te explico...",
  "¡Excelente! Esa información te será muy útil."
];

const INITIAL_MENU_PARAMS: Partial<MenuParams> = {
  tipo_reunion: '',
  sede: '',
  fecha: '',
  hora: '',
  asistentes: 0,
  restricciones: "Ninguna",
  presupuesto: 0,
  solicitante: ''
};

const QUESTIONS = {
  tipo_reunion: "¿Qué tipo de reunión estás organizando?",
  sede: "¿En qué sede se realizará la reunión?",
  fecha: "¿Qué fecha está programada para la reunión? (formato: DD/MM/YYYY)",
  hora: "¿A qué hora comenzará la reunión? (formato: HH:MM)",
  asistentes: "¿Cuántas personas asistirán a la reunión?",
  restricciones: "¿Hay alguna restricción alimentaria que debamos considerar? (ej: vegetarianos, alérgicos, etc.)",
  presupuesto: "¿Cuál es el presupuesto total disponible para el menú?",
  solicitante: "¿Cuál es tu nombre de usuario?"
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [menuParams, setMenuParams] = useState<Partial<MenuParams>>({});
  const [validValues, setValidValues] = useState<ValidValues>({
    tipos: [],
    sedes: [],
    ciudades: [],
    proveedores: []
  });

  // Cargar valores válidos al iniciar
  useEffect(() => {
    const loadValidValues = async () => {
      try {
        const values = await getValidValues();
        setValidValues(values);
        setIsConnected(true);
      } catch (error) {
        console.error('Error loading valid values:', error);
        setIsConnected(false);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            content: 'Sin conexión al servidor. Por favor, asegúrate de que el servidor esté corriendo.',
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
      }
    };
    loadValidValues();
  }, []);

  const checkIfComplete = (params: Partial<MenuParams>): boolean => {
    return !!(
      params.tipo_reunion &&
      params.sede &&
      params.fecha &&
      params.hora &&
      params.asistentes &&
      params.presupuesto &&
      params.solicitante
    );
  };

  const getMissingInfo = (params: Partial<MenuParams>): string[] => {
    const requiredFields: (keyof MenuParams)[] = [
      'tipo_reunion',
      'sede',
      'fecha',
      'hora',
      'asistentes',
      'presupuesto',
      'solicitante'
    ];
    return requiredFields.filter(field => !params[field]);
  };

  const processUserInput = async (input: string) => {
    if (!isConnected) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), content: input, sender: 'user', timestamp: new Date() },
        {
          id: (Date.now() + 1).toString(),
          content: 'Sin conexión al servidor. Por favor, asegúrate de que el servidor esté corriendo.',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      return;
    }

    // Agregar mensaje del usuario inmediatamente
    const userMessageId = Date.now().toString();
    setMessages(prev => [
      ...prev,
      { id: userMessageId, content: input, sender: 'user', timestamp: new Date() }
    ]);

    // Agregar mensaje de "escribiendo" del bot
    const typingMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      { 
        id: typingMessageId, 
        content: '', 
        sender: 'bot', 
        timestamp: new Date(),
        isTyping: true 
      }
    ]);

    setIsLoading(true);
    try {
      const response = await parseUserInput(input, { menuParams, validValues });
      
      // Si la conversación debe terminar, solo mostrar el mensaje de cierre
      if (response.shouldEndConversation) {
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== typingMessageId),
          { 
            id: (Date.now() + 1).toString(), 
            content: response.message, 
            sender: 'bot', 
            timestamp: new Date() 
          }
        ]);
        // Limpiar los parámetros para una nueva conversación
        setMenuParams(INITIAL_MENU_PARAMS);
        return;
      }
      
      // Actualizar parámetros con la información extraída
      const updatedParams = {
        ...menuParams,
        ...response.extractedInfo
      };
      setMenuParams(updatedParams);

      // Verificar si tenemos toda la información necesaria
      const missingInfo = getMissingInfo(updatedParams);
      const isComplete = missingInfo.length === 0;

      let botMessage = response.message;

      if (isComplete) {
        // Reemplazar el mensaje de "escribiendo" con la respuesta inicial
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== typingMessageId),
          { 
            id: (Date.now() + 1).toString(), 
            content: botMessage, 
            sender: 'bot', 
            timestamp: new Date() 
          },
          {
            id: (Date.now() + 2).toString(),
            content: 'Perfecto, ahora buscaré en la base de datos las opciones de menú que mejor se adapten a tus necesidades...',
            sender: 'bot',
            timestamp: new Date()
          }
        ]);

        // Agregar nuevo mensaje de "escribiendo" mientras se busca en la base de datos
        const searchingMessageId = (Date.now() + 3).toString();
        setMessages(prev => [
          ...prev,
          { 
            id: searchingMessageId, 
            content: '', 
            sender: 'bot', 
            timestamp: new Date(),
            isTyping: true 
          }
        ]);

        // Obtener menús y generar recomendación
        const menuItems = await getMenuItems();
        const recommendation = await generateMenuRecommendation(menuItems, updatedParams as MenuParams);
        
        // Reemplazar el mensaje de "escribiendo" con la recomendación
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== searchingMessageId),
          {
            id: (Date.now() + 4).toString(),
            content: recommendation,
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
      } else if (missingInfo.length > 0) {
        // Agregar recordatorio amigable sobre la información faltante
        const missingFields = missingInfo.map(field => {
          switch (field) {
            case 'tipo_reunion': return 'tipo de reunión';
            case 'sede': return 'sede';
            case 'fecha': return 'fecha';
            case 'hora': return 'hora';
            case 'asistentes': return 'número de asistentes';
            case 'presupuesto': return 'presupuesto por persona';
            case 'solicitante': return 'nombre del solicitante';
            default: return field;
          }
        });

        if (missingFields.length === 1) {
          botMessage += `\n\nSolo nos falta saber el ${missingFields[0]}. ¿Podrías proporcionármelo?`;
        } else {
          botMessage += `\n\nNos faltan algunos detalles: ${missingFields.join(', ')}. ¿Podrías proporcionármelos?`;
        }

        // Reemplazar el mensaje de "escribiendo" con la respuesta
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== typingMessageId),
          { 
            id: (Date.now() + 1).toString(), 
            content: botMessage, 
            sender: 'bot', 
            timestamp: new Date() 
          }
        ]);
      }
    } catch (error) {
      console.error('Error processing user input:', error);
      // Reemplazar el mensaje de "escribiendo" con el mensaje de error
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== typingMessageId),
        { 
          id: (Date.now() + 1).toString(), 
          content: 'Lo siento, hubo un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?', 
          sender: 'bot', 
          timestamp: new Date() 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    await processUserInput(content);
  }, [menuParams, validValues, isConnected]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setMenuParams(INITIAL_MENU_PARAMS);
  }, []);

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearChat
  };
};
