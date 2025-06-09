export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
}

export interface MenuParams {
  tipo_reunion: string;
  sede: string;
  fecha: string;
  hora: string;
  asistentes: number;
  restricciones: string;
  presupuesto: number;
  solicitante: string;
}

export interface MenuItem {
  id: number;
  plato: string;
  descripcion: string;
  tipo: string;
  precio: number;
  restricciones: string[];
  proveedor: string;
  sede: string;
  ciudad: string;
}

export interface ValidValues {
  tipos: string[];
  sedes: Array<{ id: number; nombre: string }>;
  ciudades: Array<{ id: number; nombre: string }>;
  proveedores: Array<{ id: number; nombre: string }>;
}

export interface ConversationContext {
  menuParams: Partial<MenuParams>;
  isCollectingInfo: boolean;
  hasRestrictions: boolean;
  isComplete: boolean;
}

export interface ParsedResponse {
  type: 'greeting' | 'menu_info' | 'restrictions' | 'unknown' | 'conversation_end';
  extractedInfo: Partial<MenuParams>;
  message: string;
  shouldEndConversation: boolean;
}
