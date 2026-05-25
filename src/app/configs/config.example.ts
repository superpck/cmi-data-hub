export default {
  appName: "AI Prompt",
  appDescription: "A collection of AI prompts for Deep Rock Galactic.",
  appVersion: "0.0.1",
  apiEndpoint:
  {
    user: "https://myurl/api/user",
    drg_data: "https://myurl/drg/api",
    ai: {
      url: "https://myurl/ai-api",
      chat_endpoint: "/v1/chat/interaction",
      message_endpoint: "/v1/chat/message",
    } ,
    callback: "https://myurl/callback"
  },
  theme: {
    primaryColor: "#4CAF50",
    secondaryColor: "#FFC107",
    backgroundColor: "#F5F5F5",
    textColor: "#333333",
  },
  tokenName: "My-Token",
};