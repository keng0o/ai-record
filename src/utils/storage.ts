import { Chat } from "@/types";

export const loadFromStorage = () => {
  const storedChats = localStorage.getItem("chats");
  const storedActiveChatId = localStorage.getItem("activeChatId");

  return {
    storedChats: storedChats ? (JSON.parse(storedChats) as Chat[]) : null,
    storedActiveChatId,
  };
};

export const saveToStorage = ({
  chats,
  activeChatId,
}: {
  chats: Chat[];
  activeChatId: string | null;
}) => {
  localStorage.setItem("chats", JSON.stringify(chats));
  if (activeChatId) {
    localStorage.setItem("activeChatId", activeChatId);
  }
};
