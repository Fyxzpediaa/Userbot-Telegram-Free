const { formatHeader } = require('../function');
const { Api } = require('telegram');

// ============================================================
// KELOLA USERBOT: Keluar dari grup yang mem-mute, dan Status/Ping
// ============================================================

async function checkCanSendInGroup(client, dialog) {
  try {
    const result = await client["invoke"](new Api["channels"]["GetParticipant"]({ "channel": dialog.id, "participant": "me" }));
    const p = result["participant"];
    if (p && p["className"] === "ChannelParticipantBanned" && p["bannedRights"] && p["bannedRights"]["sendMessages"]) {
      return false; // secara spesifik dibatasi kirim pesan di grup ini
    }
    return true;
  } catch (e) {
    return true; // gagal dicek -> anggap AMAN (fail-safe, jangan sampai salah keluar dari grup)
  }
}

/**
 * Cek semua grup/channel yang diikuti, keluar dari yang mem-mute userbot.
 * Dipakai dari command teks maupun tombol panel.
 */
async function leaveMutedGroups(client) {
  const dialogs = await client["getDialogs"]({});
  const groups = dialogs.filter((d) => d.isGroup || d.isChannel);
  let checked = 0, left = 0;
  const leftNames = [];

  for (const dialog of groups) {
    checked++;
    const canSend = await checkCanSendInGroup(client, dialog);
    if (!canSend) {
      try {
        await client["invoke"](new Api["channels"]["LeaveChannel"]({ "channel": dialog.id }));
        left++;
        leftNames.push((dialog.title || "Tanpa Judul").toString());
      } catch (e) {
        try {
          const me = await client["getMe"]();
          await client["invoke"](new Api["messages"]["DeleteChatUser"]({ "chatId": dialog.id, "userId": me.id }));
          left++;
          leftNames.push((dialog.title || "Tanpa Judul").toString());
        } catch (e2) {}
      }
      await new Promise((r) => setTimeout(r, 1000)); // jeda anti-flood antar leave
    }
  }
  return { checked, left, leftNames };
}

async function getStatus(client) {
  const dialogs = await client["getDialogs"]({});
  const groups = dialogs.filter((d) => d.isGroup).length;
  const channels = dialogs.filter((d) => d.isChannel).length;
  const uptimeSec = Math.floor(process.uptime());
  const mem = process.memoryUsage();
  const t0 = Date.now();
  await client["getMe"]();
  const pingMs = Date.now() - t0;

  const h = Math.floor(uptimeSec / 3600), m = Math.floor((uptimeSec % 3600) / 60), s = uptimeSec % 60;
  return {
    groups, channels, pingMs,
    memMB: (mem.heapUsed / 1024 / 1024).toFixed(1),
    uptimeStr: `${h}j ${m}m ${s}d`
  };
}

module.exports = {
  commands: ["leavemuted", "ping", "status"],
  ownerOnly: true,
  leaveMutedGroups,
  getStatus,
  run: async ({ client, msg, cmdName }) => {
    const targetChat = msg.chatId;

    if (cmdName === "leavemuted") {
      const statusMsg = await client["sendMessage"](targetChat, {
        "message": `${formatHeader("Leave Muted Groups")}Sedang memeriksa semua grup/channel, mohon tunggu...`,
        "parseMode": "html", "replyTo": msg.id
      });
      const result = await leaveMutedGroups(client);
      return client["editMessage"](targetChat, {
        "message": statusMsg.id,
        "text": `${formatHeader("Leave Muted Groups Selesai")}• Diperiksa: <b>${result.checked}</b> grup/channel\n• Keluar dari: <b>${result.left}</b> grup yang mem-mute\n${result.leftNames.length ? "\n" + result.leftNames.map((n, i) => `${i + 1}. ${n}`).join("\n") : ""}`,
        "parseMode": "html"
      });
    }

    if (cmdName === "ping" || cmdName === "status") {
      const st = await getStatus(client);
      return client["sendMessage"](targetChat, {
        "message": `${formatHeader("Status Userbot")}• Ping: <code>${st.pingMs}ms</code>\n• Uptime: <code>${st.uptimeStr}</code>\n• Memori: <code>${st.memMB} MB</code>\n• Grup: <code>${st.groups}</code>\n• Channel: <code>${st.channels}</code>`,
        "parseMode": "html", "replyTo": msg.id
      });
    }
  }
};
