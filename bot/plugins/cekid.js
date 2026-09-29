const { formatHeader } = require('../function');

module.exports = {
  commands: ["cekid"],
  ownerOnly: false,
  run: async ({ client, msg }) => {
    let targetId = msg.senderId.toString();
    let targetName = "Kamu";

    if (msg.replyToMsgId) {
      const replyMsg = await client.getMessages(msg.chatId, { ids: msg.replyToMsgId });
      if (replyMsg && replyMsg[0] && replyMsg[0].senderId) {
        targetId = replyMsg[0].senderId.toString();
        targetName = "Target User";
      }
    }

    const output = `${formatHeader("Id Checker Information")}• Objek: ${targetName}\n• Telegram ID: <code>${targetId}</code>\n• Chat ID Saat ini: <code>${msg.chatId}</code>`;
    await client.sendMessage(msg.chatId, { message: output, parseMode: "html", replyTo: msg.id });
  }
};
