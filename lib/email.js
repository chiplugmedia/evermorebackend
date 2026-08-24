import nodemailer from "nodemailer";

export async function sendRegistrationEmail(userData) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Evermore AI" <${process.env.SMTP_USER}>`,
    to: "chiplugtv@gmail.com",
    subject: `🎉 New Paid Registration - ${userData.fullname}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Evermore Registration</title>
    </head>

    <body style="
      margin:0;
      padding:0;
      background:#f4f7fb;
      font-family:Arial, Helvetica, sans-serif;
    ">

      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">

            <table width="650" cellpadding="0" cellspacing="0" style="
              background:#ffffff;
              border-radius:24px;
              overflow:hidden;
           
            ">

              <!-- Header -->
              <tr>
                <td style="
                  background:linear-gradient(135deg,#0E2258,#0F9AC5);
                  padding:40px;
                  text-align:center;
                ">

                  <img
                    src="https://evermorenetwork.com/src/assets/img/evermorelogoblack.png"
                    alt="Evermore"
                    style="
                      height:60px;
                      margin-bottom:20px;
                    "
                  />

                  <h1 style="
                    color:#ffffff;
                    margin:0;
                    font-size:32px;
                    font-weight:800;
                  ">
                    Payment Successful
                  </h1>

                  <p style="
                    color:rgba(255,255,255,.9);
                    margin-top:12px;
                    font-size:16px;
                  ">
                    A new subscriber has successfully completed payment.
                  </p>

                </td>
              </tr>

              <!-- Success Badge -->
              <tr>
                <td align="center" style="padding-top:30px;">

                  <div style="
                    display:inline-block;
                    background:#00E57B;
                    color:#0E2258;
                    font-weight:700;
                    padding:10px 20px;
                    border-radius:999px;
                    font-size:14px;
                  ">
                    VERIFIED PAYMENT
                  </div>

                </td>
              </tr>

              <!-- User Details -->
              <tr>
                <td style="padding:35px;">

                  <h2 style="
                    color:#0E2258;
                    margin-top:0;
                    margin-bottom:25px;
                  ">
                    Subscriber Information
                  </h2>

                  <table width="100%" cellpadding="0" cellspacing="0">

                    <tr>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;">
                        <strong style="color:#0E2258;">Full Name</strong>
                      </td>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;text-align:right;">
                        ${userData.fullname}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;">
                        <strong style="color:#0E2258;">Email Address</strong>
                      </td>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;text-align:right;">
                        ${userData.email}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;">
                        <strong style="color:#0E2258;">Phone Number</strong>
                      </td>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;text-align:right;">
                        ${userData.phone}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;">
                        <strong style="color:#0E2258;">Plan Selected</strong>
                      </td>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;text-align:right;">
                        ${userData.plan}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;">
                        <strong style="color:#0E2258;">Amount Paid</strong>
                      </td>
                      <td style="
                        padding:14px;
                        border-bottom:1px solid #E5E5E5;
                        text-align:right;
                        color:#00A95A;
                        font-weight:700;
                      ">
                        ₦${Number(userData.amount).toLocaleString()}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;">
                        <strong style="color:#0E2258;">Transaction Ref</strong>
                      </td>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;text-align:right;">
                        ${userData.tx_ref}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;">
                        <strong style="color:#0E2258;">Transaction ID</strong>
                      </td>
                      <td style="padding:14px;border-bottom:1px solid #E5E5E5;text-align:right;">
                        ${userData.transaction_id || "N/A"}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:14px;">
                        <strong style="color:#0E2258;">Payment Status</strong>
                      </td>
                      <td style="
                        padding:14px;
                        text-align:right;
                        color:#00A95A;
                        font-weight:700;
                      ">
                        PAID
                      </td>
                    </tr>

                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  background:#0E2258;
                  padding:25px;
                  text-align:center;
                ">

                  <p style="
                    margin:0;
                    color:#E5E5E5;
                    font-size:14px;
                  ">
                    Evermore AI Platform
                  </p>

                  <p style="
                    margin-top:8px;
                    color:rgba(229,229,229,.7);
                    font-size:12px;
                  ">
                    Registration Date:
                    ${new Date().toLocaleString()}
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
