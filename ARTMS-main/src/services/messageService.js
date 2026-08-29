import api from "./api";

const messageService = {
  getConversations: () => api.get("/messages/conversations"),
  getUsers: () => api.get("/messages/users"),
  getThread: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (receiverId, body) => api.post("/messages", { receiver_id: receiverId, body }),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
};

export default messageService;
