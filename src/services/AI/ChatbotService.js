// services/ChatService.js
import axios from "axios";

export class ChatService {
  static async ask(question, projectId = null) {
    const payload = { question };
    if (projectId !== null) {
      payload.project_id = projectId;
    }
    try {
      const response = await axios.post("http://127.0.0.1:8087/chat/ask", payload);
      return response.data;
    } catch (error) {
      console.error("Failed to ask question:", error);
      throw error;
    }
  }
}
