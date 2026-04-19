const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1495113034077704314/0qUTjfxBW3trvmWyqVTopIfiHik1Q28F99-6lVDJs5r38Kplbnoz4Rs6lhWevmqP-YVA";

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  color: number;
  fields: DiscordField[];
  timestamp: string;
}

async function sendWebhook(embed: DiscordEmbed): Promise<void> {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function logNewAccount(username: string, createdAt: string): Promise<void> {
  await sendWebhook({
    title: "حساب جديد",
    color: 0x00c853,
    fields: [
      { name: "اسم المستخدم", value: `@${username}`, inline: true },
      { name: "الوقت", value: formatDate(createdAt), inline: true },
    ],
    timestamp: new Date().toISOString(),
  });
}

export async function logProfileUpdate(
  username: string,
  changes: Record<string, { old: string; new: string }>,
): Promise<void> {
  const fields: DiscordField[] = [{ name: "اسم المستخدم", value: `@${username}`, inline: false }];
  for (const [key, change] of Object.entries(changes)) {
    const keyAr = key === "name" ? "الاسم" : key === "bio" ? "السيرة الذاتية" : "الصورة";
    fields.push({
      name: `تغيير ${keyAr}`,
      value: `${change.old || "(فارغ)"} ← ${change.new || "(فارغ)"}`,
      inline: false,
    });
  }
  await sendWebhook({
    title: "تحديث حساب",
    color: 0xffd600,
    fields,
    timestamp: new Date().toISOString(),
  });
}

export async function logNewPost(
  username: string,
  content: string,
  postId: string,
  image?: string,
): Promise<void> {
  const fields: DiscordField[] = [
    { name: "اسم المستخدم", value: `@${username}`, inline: true },
    { name: "معرف التغريدة", value: postId, inline: true },
    { name: "المحتوى", value: content.substring(0, 300) || "(لا محتوى)", inline: false },
  ];
  if (image) {
    fields.push({ name: "صورة", value: image, inline: false });
  }
  await sendWebhook({
    title: "تغريدة جديدة",
    color: 0x7241d3,
    fields,
    timestamp: new Date().toISOString(),
  });
}

export async function logInteraction(
  username: string,
  action: "إعجاب" | "إعادة تغريد" | "إلغاء إعجاب" | "إلغاء إعادة تغريد",
  postId: string,
): Promise<void> {
  await sendWebhook({
    title: "تفاعل",
    color: 0x1565c0,
    fields: [
      { name: "اسم المستخدم", value: `@${username}`, inline: true },
      { name: "الإجراء", value: action, inline: true },
      { name: "معرف التغريدة", value: postId, inline: true },
    ],
    timestamp: new Date().toISOString(),
  });
}

export async function logAdminAction(
  adminUsername: string,
  action: string,
  targetUsername: string,
): Promise<void> {
  await sendWebhook({
    title: "إجراء إداري",
    color: 0xd32f2f,
    fields: [
      { name: "المدير", value: `@${adminUsername}`, inline: true },
      { name: "الإجراء", value: action, inline: true },
      { name: "المستهدف", value: `@${targetUsername}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  });
}
