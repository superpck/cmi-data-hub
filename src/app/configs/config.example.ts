import { version, subVersion } from '../../../package.json';

export default {
  appName: "AI Prompt",
  appDescription: "A collection of AI prompts for Deep Rock Galactic.",
  version,
  subVersion,
  apiEndpoint:
  {
    user: "https://myurl/api/user",
    drg_data: "https://myurl/drg/api",
    callback: "https://myurl/callback"
  },
  theme: {
    primaryColor: "#4CAF50",
    secondaryColor: "#FFC107",
    backgroundColor: "#F5F5F5",
    textColor: "#333333",
  },
  tokenName: "My-Token",
  drgTokenName: "My-DRG-Token",
};