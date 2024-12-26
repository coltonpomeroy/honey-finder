export const customEmailTemplate = ({ url, host, email }) => {
    const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;
    const escapedHost = `${host.replace(/\./g, "&#8203;.")}`;
  
    const text = `Sign in to ${escapedHost}\n${url}\n\n`;
    const html = `
      <body>
        <table width="100%" border="0" cellspacing="20" cellpadding="0"
          style="background-color: #f9f9f9; max-width: 600px; margin: auto; border-radius: 10px;">
          <tr>
            <td align="center"
              style="padding: 20px 0; font-size: 24px; font-family: Helvetica, Arial, sans-serif; color: #333;">
              Welcome to ${escapedHost}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 5px;" bgcolor="#007bff">
                    <a href="${url}" target="_blank"
                      style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid #007bff; display: inline-block; font-weight: bold;">
                      Sign in
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center"
              style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #333;">
              If you did not request this email you can safely ignore it.
            </td>
          </tr>
        </table>
      </body>
    `;
  
    return { text, html };
  };