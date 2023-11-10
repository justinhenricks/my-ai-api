import * as postmark from "postmark";
const serverToken = process.env.POSTMARK_SERVER_TOKEN as string;

export async function sendEmail({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  const client = new postmark.ServerClient(serverToken);

  return client.sendEmail({
    To: "justinhenricks@gmail.com",
    From: "Justin <mailer@derekdiscanio.com>",
    ReplyTo: "justinhenricks@gmail.com",
    Subject: subject,
    TextBody: body,
    HtmlBody: body,
  });
}
