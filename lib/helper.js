import { userSocketIDs } from "../index.js";

export const getBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const getSockets = (user) => {
  if (!user) {
    console.error("No user ID provided for socket lookup");
    return null;
  }

  const socket = userSocketIDs.get(user.toString());

  if (!socket) {
    console.error(`No socket found for user ID: ${user}`);
    return null;
  }

  return socket;
};
