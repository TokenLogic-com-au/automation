export const sendTelegramAlert = async (
  token: string,
  chatId: string,
  chainId: number,
  duration: number
) => {
  const durationStr = duration.toFixed(2);

  const msg =
    `<b>Web3Function slow execution</b>\n` +
    `<b>Chain:</b> <code>${chainId}</code>\n` +
    `<b>Duration:</b> <code>${durationStr}s</code>\n`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: msg,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  console.log("Telegram alert sent!");
};
