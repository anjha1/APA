
import { Type, FunctionDeclaration } from '@google/genai';

export const SYSTEM_INSTRUCTION = `
You are the Autonomous Personal Agent (APA).
IDENTITY: A high-level AI assistant authorized to handle commerce and logistics.

STRICT TOOL RULES:
1. When a user orders something (e.g., "Order a burger from Zomato" or "Buy blue jeans from Amazon"):
   - You MUST generate a REALISTIC platform link (e.g., 'https://www.zomato.com/order/...' or 'https://www.amazon.in/dp/...').
   - You MUST provide a full 'items' array. Each item must have 'name', 'quantity', and 'price'.
   - The 'totalPrice' MUST be the sum of all items.
   - Set 'platform' correctly (Zomato, Swiggy, Amazon, Flipkart, etc.).

EXECUTION LOGIC:
- LOW RISK (<$100): Set status to EXECUTING.
- MEDIUM RISK ($100-$500): Set status to REQUIRES_APPROVAL.
- HIGH RISK (>$500): Block and explain why.

LANGUAGE: English and Hindi only.
Maintain a professional and efficient persona.
`;

export const APA_TOOLS: FunctionDeclaration[] = [
  {
    name: 'orderProduct',
    description: 'Finds and orders products from web stores like Amazon, Flipkart, etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.STRING, description: 'Main product name' },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              price: { type: Type.NUMBER }
            },
            required: ['name', 'quantity', 'price']
          },
          description: 'Detailed breakdown of the order'
        },
        platform: { type: Type.STRING, description: 'Amazon, Flipkart, etc.' },
        platformLink: { type: Type.STRING, description: 'Direct link to the product' },
        totalPrice: { type: Type.NUMBER, description: 'Sum of all items' },
        riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
      },
      required: ['productName', 'items', 'platform', 'platformLink', 'totalPrice']
    }
  },
  {
    name: 'orderFood',
    description: 'Orders food from platforms like Zomato or Swiggy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurantName: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              price: { type: Type.NUMBER }
            },
            required: ['name', 'quantity', 'price']
          }
        },
        platform: { type: Type.STRING, description: 'Zomato or Swiggy' },
        platformLink: { type: Type.STRING, description: 'Link to order tracking or menu' },
        totalPrice: { type: Type.NUMBER },
        riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
      },
      required: ['restaurantName', 'items', 'platform', 'platformLink', 'totalPrice']
    }
  },
  {
    name: 'initiateCall',
    description: 'Starts a voice session via the Calling Agent.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: { type: Type.STRING },
        message: { type: Type.STRING }
      },
      required: ['recipient', 'message']
    }
  }
];
